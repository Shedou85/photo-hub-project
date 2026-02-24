<?php
// backend/db.php

function getDbConnection() {
    $config = require __DIR__ . '/config.php';

    $dbConfig = $config['db'];
    $host = $dbConfig['host'];
    $port = $dbConfig['port'];
    $dbname = $dbConfig['dbname'];
    $charset = $dbConfig['charset'];

    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['password'], $options);
        return $pdo;
    } catch (\PDOException $e) {
        error_log('Database connection error: ' . $e->getMessage());
        throw new \PDOException('Database connection failed.', (int)$e->getCode());
    }
}
