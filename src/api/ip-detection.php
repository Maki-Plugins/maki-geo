<?php

class mgeo_IpDetection
{
    public function getRequestIP()
    {
        $remote_addr = rest_is_ip_address(sanitize_text_field(wp_unslash($_SERVER["REMOTE_ADDR"])));
        if(!$remote_addr) {
            return false;
        }

        $cloudflare = $this::isCloudflare();

        if ($cloudflare) {
            return rest_is_ip_address(sanitize_text_field(wp_unslash($_SERVER["HTTP_CF_CONNECTING_IP"])));
        }
        return $remote_addr;
        
    }

    private function ipInRange($ip, $range)
    {
        // Check if IP is IPv6
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $this->ipv6InRange($ip, $range);
        }

        // IPv4 handling
        if (strpos($range, "/") == false) {
            $range .= "/32";
        }

        list($range, $netmask) = explode("/", $range, 2);
        $range_decimal = ip2long($range);
        $ip_decimal = ip2long($ip);
        $wildcard_decimal = pow(2, 32 - $netmask) - 1;
        $netmask_decimal = ~$wildcard_decimal;
        return ($ip_decimal & $netmask_decimal) ==
            ($range_decimal & $netmask_decimal);
    }

    private function ipv6InRange($ip, $range)
    {
        // Split range into IP and prefix length
        list($range, $netmask) = explode("/", $range, 2);

        // Convert IP and range to binary strings
        $ip_bin = inet_pton($ip);
        $range_bin = inet_pton($range);

        if (!$ip_bin || !$range_bin) {
            return false;
        }

        // Convert binary strings to bits
        $ip_bits = $this->ipv6ToBits($ip_bin);
        $range_bits = $this->ipv6ToBits($range_bin);

        // Compare the first n bits, where n is the prefix length
        return substr($ip_bits, 0, $netmask) ===
            substr($range_bits, 0, $netmask);
    }

    private function ipv6ToBits($binary)
    {
        $bits = "";
        for ($i = 0; $i < strlen($binary); $i++) {
            $bits .= str_pad(decbin(ord($binary[$i])), 8, "0", STR_PAD_LEFT);
        }
        return $bits;
    }

    private function cloudflareCheckIP($ip)
    {
        $json_file = dirname(__FILE__) . "/../assets/cf-ip-ranges.json";

        if (!file_exists($json_file)) {
            return false;
        }

        $request = wp_remote_get($json_file);
        if(is_wp_error($request) ) {
            return false;
        }

        // Retrieve the data
        $body = wp_remote_retrieve_body($request);
        $ranges = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        // Determine if we're dealing with IPv4 or IPv6
        $is_ipv6 =
            filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;
        $ranges_to_check = $is_ipv6 ? $ranges["v6"] : $ranges["v4"];

        foreach ($ranges_to_check as $range) {
            if ($this::ipInRange($ip, $range)) {
                return true;
            }
        }

        return false;
    }

    private function cloudflareRequestsCheck()
    {
        if (!isset($_SERVER["HTTP_CF_CONNECTING_IP"]) || !isset($_SERVER["HTTP_CF_IPCOUNTRY"]) || !isset($_SERVER["HTTP_CF_RAY"]) || !isset($_SERVER["HTTP_CF_VISITOR"])) {
            return false;
        }
        return true;
    }

    private function isCloudflare()
    {
        $ipCheck = $this::cloudflareCheckIP($_SERVER["REMOTE_ADDR"]);
        $requestCheck = $this::cloudflareRequestsCheck();
        return $ipCheck && $requestCheck;
    }
}
