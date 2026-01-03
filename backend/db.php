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
        // In a real app, you would log this error and show a generic message
        // For now, we'll just throw the exception during development
        throw new \PDOException($e->getMessage(), (int)$e->getCode());
    }
}
