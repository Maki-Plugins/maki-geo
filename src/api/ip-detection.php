<?php

class mgeo_IpDetection
{
    // Use when handling ip's
    public function getRequestIP()
    {
        $cloudflare = $this::isCloudflare();

        if($cloudflare) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        } else {
            return $_SERVER['REMOTE_ADDR'];
        }
    }

    private function ipInRange($ip, $range)
    {
        if (strpos($range, '/') == false) {
            $range .= '/32';
        }

        // $range is in IP/CIDR format eg 127.0.0.1/24
        list($range, $netmask) = explode('/', $range, 2);
        $range_decimal = ip2long($range);
        $ip_decimal = ip2long($ip);
        $wildcard_decimal = pow(2, (32 - $netmask)) - 1;
        $netmask_decimal = ~ $wildcard_decimal;
        return (($ip_decimal & $netmask_decimal) == ($range_decimal & $netmask_decimal));
    }

    private function cloudflareCheckIP($ip)
    {
        $json_file = dirname(__FILE__) . '/../assets/cf-ip-ranges.json';
        
        if (!file_exists($json_file)) {
            return false;
        }

        $ranges = json_decode(file_get_contents($json_file), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        // Determine if we're dealing with IPv4 or IPv6
        $is_ipv6 = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;
        $ranges_to_check = $is_ipv6 ? $ranges['v6'] : $ranges['v4'];

        foreach ($ranges_to_check as $range) {
            if ($this::ipInRange($ip, $range)) {
                return true;
            }
        }
        
        return false;
    }

    private function cloudflareRequestsCheck()
    {
        $flag = true;

        if(!isset($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $flag = false;
        }
        if(!isset($_SERVER['HTTP_CF_IPCOUNTRY'])) {
            $flag = false;
        }
        if(!isset($_SERVER['HTTP_CF_RAY'])) {             $flag = false;
        }
        if(!isset($_SERVER['HTTP_CF_VISITOR'])) {         $flag = false;
        }
        return $flag;
    }

    private function isCloudflare()
    {
        $ipCheck        = $this::cloudflareCheckIP($_SERVER['REMOTE_ADDR']);
        $requestCheck   = $this::cloudflareRequestsCheck();
        return ($ipCheck && $requestCheck);
    }


}
