<?php
if (!defined("ABSPATH")) {
    exit();
}

class mgeo_IpDetection
{
    public function getRequestIP()
    {
        if (!isset($_SERVER["REMOTE_ADDR"])) {
            return false;
        }
        $remote_addr = rest_is_ip_address(sanitize_text_field(wp_unslash($_SERVER["REMOTE_ADDR"])));
        
        if (!$remote_addr) {
            return false;
        }

        if (isset($_SERVER["HTTP_CF_CONNECTING_IP"]) && $this->isCloudflare($remote_addr)) {
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

    /**
     * Cloudflare IP ranges
     * Source: https://www.cloudflare.com/ips/
     */
    private $cf_ipv4_ranges = [
        "103.21.244.0/22",
        "103.22.200.0/22",
        "103.31.4.0/22",
        "104.16.0.0/13",
        "104.24.0.0/14",
        "108.162.192.0/18",
        "131.0.72.0/22",
        "141.101.64.0/18",
        "162.158.0.0/15",
        "172.64.0.0/13",
        "173.245.48.0/20",
        "188.114.96.0/20",
        "190.93.240.0/20",
        "197.234.240.0/22",
        "198.41.128.0/17"
    ];

    private $cf_ipv6_ranges = [
        "2400:cb00::/32",
        "2405:8100::/32",
        "2405:b500::/32",
        "2606:4700::/32",
        "2803:f800::/32",
        "2a06:98c0::/29",
        "2c0f:f248::/32"
    ];

    private function cloudflareCheckIP($ip)
    {
        // Determine if we're dealing with IPv4 or IPv6
        $is_ipv6 = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;
        $ranges_to_check = $is_ipv6 ? $this->cf_ipv6_ranges : $this->cf_ipv4_ranges;

        foreach ($ranges_to_check as $range) {
            if ($this->ipInRange($ip, $range)) {
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

    private function isCloudflare($remote_addr)
    {
        $ipCheck = $this->cloudflareCheckIP($remote_addr);
        $requestCheck = $this->cloudflareRequestsCheck();
        return $ipCheck && $requestCheck;
    }
}
