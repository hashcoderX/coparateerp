<?php

$url = 'http://localhost:8000/api/login';
$data = json_encode([
    'email' => 'superadmin@sofcodelk.com',
    'password' => 'password'
]);

$options = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === false) {
    echo "Error: Unable to connect to the server.\n";
} else {
    $response = json_decode($result, true);
    if (isset($response['token'])) {
        echo $response['token'];
    } else {
        echo "Login failed: " . $result . "\n";
    }
}