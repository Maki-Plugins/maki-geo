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
        $cf_ips = array(
        '199.27.128.0/21',
        '173.245.48.0/20',
        '103.21.244.0/22',
        '103.22.200.0/22',
        '103.31.4.0/22',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '104.16.0.0/12',
        );
        $is_cf_ip = false;
        foreach ($cf_ips as $cf_ip) {
            if ($this::ipInRange($ip, $cf_ip)) {
                $is_cf_ip = true;
                break;
            }
        } return $is_cf_ip;
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
