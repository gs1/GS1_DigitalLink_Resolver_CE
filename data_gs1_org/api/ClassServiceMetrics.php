<?php

/**
 * Class ClassServiceMetrics
 * This class uses methods based on a set authored by Jeff Starr at:
 * https://wp-mix.com/php-get-server-information/
 * Copied and adjusted, with grateful thanks to Jeff!
 */
class ClassServiceMetrics
{
    /**
     * API performance and service metric
     * @param int $coreCount
     * @param int $interval
     * @return float
     */
    function api_system_load($coreCount = 2, $interval = 1)
    {
        $rs = sys_getloadavg();
        $interval = $interval >= 1 && 3 <= $interval ? $interval : 1;
        $load = $rs[$interval];
        return round(($load * 100) / $coreCount, 2);
    }

    /**
     * @return int
     */
    function api_system_cores()
    {
        $cmd = "uname";
        $OS = strtolower(trim(shell_exec($cmd)));

        switch ($OS)
        {
            case('linux'):
                $cmd = "cat /proc/cpuinfo | grep processor | wc -l";
                break;
            case('freebsd'):
                $cmd = "sysctl -a | grep 'hw.ncpu' | cut -d ':' -f2";
                break;
            default:
                unset($cmd);
        }

        if ($cmd != '')
        {
            $cpuCoreNo = intval(trim(shell_exec($cmd)));
        }

        return empty($cpuCoreNo) ? 1 : $cpuCoreNo;
    }

    /**
     * @return int
     */
    function api_http_connections()
    {
        $unique = [];
        $www_unique_count = 0;
        if (function_exists('exec'))
        {
            $www_total_count = 0;
            @exec('netstat -an | egrep \':80|:443\' | awk \'{print $5}\' | grep -v \':::\*\' |  grep -v \'0.0.0.0\'', $results);

            foreach ($results as $result)
            {
                $array = explode(':', $result);
                $www_total_count++;

                if (preg_match('/^::/', $result))
                {
                    $ipaddr = $array[3];
                }
                else
                {
                    $ipaddr = $array[0];
                }

                if (!in_array($ipaddr, $unique))
                {
                    $unique[] = $ipaddr;
                    $www_unique_count++;
                }
            }
            unset ($results);
            return count($unique);
        }
    }

    /**
     * @return float|int
     */
    function api_server_memory_usage()
    {
        $free = shell_exec('free');
        $free = (string)trim($free);
        $free_arr = explode("\n", $free);
        $mem = explode(" ", $free_arr[1]);
        $mem = array_filter($mem);
        $mem = array_merge($mem);
        $memory_usage = $mem[2] / $mem[1] * 100;
        return $memory_usage;
    }

    /**
     * @return float
     */
    function api_server_uptime()
    {
        $uptime = floor(preg_replace('/\.[0-9]+/', '', file_get_contents('/proc/uptime')) / 86400);
        return $uptime;
    }

    /**
     * @return array
     */
    function api_kernel_version()
    {
        $kernel = explode(' ', file_get_contents('/proc/version'));
        $kernel = $kernel[2];
        return $kernel;
    }

    /**
     * @return int
     */
    function api_number_processes()
    {
        $proc_count = 0;
        $dh = opendir('/proc');

        while ($dir = readdir($dh))
        {
            if (is_dir('/proc/' . $dir))
            {
                if (preg_match('/^[0-9]+$/', $dir))
                {
                    $proc_count++;
                }
            }
        }
        return $proc_count;
    }


}