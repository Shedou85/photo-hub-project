<?php
session_start();
session_destroy();
setcookie(session_name(), '', time() - 3600, '/', '.pixelforge.pro', true, true);
echo json_encode(["status" => "OK"]);
