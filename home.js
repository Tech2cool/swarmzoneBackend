export const homePage =`<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 Error - Page Not Found</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }

    .container {
        text-align: center;
    }

    h1 {
        font-size: 4em;
        margin-bottom: 10px;
        color: #333;
    }

    p {
        font-size: 1.2em;
        color: #666;
        margin-bottom: 20px;
    }

    a {
        color: #007bff;
        text-decoration: none;
        font-weight: bold;
    }

    a:hover {
        text-decoration: underline;
    }

    .error-code {
        font-size: 6em;
        color: #dc3545;
        margin-bottom: 20px;
    }

    .emoji {
        font-size: 2em;
    }
</style>
</head>
<body>
<div class="container">
    <div class="error-code">200 OK</div>
    <h1>Wellcome to backend</h1>
    <p>Sorry, the page you are looking for might need Authorization or is temporarily unavailable.</p>
    <p>Return to <a href="/">Homepage</a></p>
    <div class="emoji">😕</div>
</div>



</body></html>`