const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/generate", (req, res) => {
    const { wanCount, interfaces, lanInterface, lanIp, pccMethod, ...wanData } = req.body;
    const wanInterfaces = Array.isArray(interfaces) ? interfaces : [];

    if (wanInterfaces.length !== parseInt(wanCount)) {
        return res.send("Error: The number of WAN interfaces does not match the count provided.");
    }

    let script = `### SETTING IP ADDRESS ###\n`;
    script += `/ip address\n`;
    wanInterfaces.forEach((iface, index) => {
        const wanIp = wanData[`wan${index + 1}Ip`];
        script += `add address=${wanIp}/24 interface=${iface} disable=no\n`;
    });
    script += `add address=${lanIp}/24 interface=${lanInterface} disable=no\n`;
    script += `\n\n`;

    script += `### SETTING IP DNS ###\n`;
    script += `/ip dns\n`;
    script += `set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes\n`;
    script += `\n\n`;

    script += `### SETTING ROUTING TABLE ###\n`;
    script += `/routing table\n`;
    wanInterfaces.forEach((iface, index) => {
        script += `add disabled=no fib name=wan${index + 1}\n`;
    });
    script += `\n\n`;

    script += `### SETTING BYPASS LAN NETWORK ###\n`;
    script += `/ip firewall mangle\n`;
    const lanNetwork = `${lanIp.split('.').slice(0, 3).join('.')}.0/24`;
    script += `add action=accept chain=prerouting dst-address=${lanNetwork} src-address=${lanNetwork}\n`;
    script += `\n\n`;

    script += `### SETTING PCC LOAD BALANCER ###\n`;
    script += `/ip firewall mangle\n`;
    wanInterfaces.forEach((iface, index) => {
        script += `add action=mark-connection chain=input in-interface=${iface} new-connection-mark=con-wan${index + 1} passthrough=yes\n`;
    });
    script += `\n`;

    wanInterfaces.forEach((iface, index) => {
        const wanGateway = wanData[`wan${index + 1}Gateway`];
        script += `add action=mark-connection chain=prerouting in-interface=${lanInterface} new-connection-mark=con-wan${index + 1} passthrough=yes per-connection-classifier=${pccMethod}:${wanCount}/${index}\n`;
    });
    script += `\n`;

    wanInterfaces.forEach((iface, index) => {
        const wanGateway = wanData[`wan${index + 1}Gateway`];
        script += `add action=mark-routing chain=prerouting connection-mark=con-wan${index + 1} in-interface=${lanInterface} new-routing-mark=wan${index + 1} passthrough=yes\n`;
    });
    script += `\n\n`;

    script += `### SETTING FIREWALL NAT ###\n`;
    script += `/ip firewall nat\n`;
    wanInterfaces.forEach((iface, index) => {
        script += `add action=masquerade chain=srcnat connection-mark=con-wan${index + 1} out-interface=${iface}\n`;
    });
    script += `add action=masquerade chain=srcnat\n`;
    script += `\n\n`;

    script += `### SETTING GATEWAY & FAILOVER ###\n`;
    script += `/ip route\n`;
    wanInterfaces.forEach((iface, index) => {
        const wanGateway = wanData[`wan${index + 1}Gateway`];
        const distance = index + 1;
        script += `add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=${wanGateway} routing-table=wan${index + 1}\n`;
    });
    wanInterfaces.forEach((iface, index) => {
        const wanGateway = wanData[`wan${index + 1}Gateway`];
        const distance = index + 1;
        script += `add check-gateway=ping disabled=no distance=${distance} dst-address=0.0.0.0/0 gateway=${wanGateway} routing-table=main\n`;
    });
    script += `\n`;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Generated MikroTik Script</title>
            <link rel="stylesheet" href="/css/style.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <h2 class="text-center mt-4"><a href="/" class="home-link">MikroTik v7 - PCC Load Balancer Script</a></h2>
		<h6 class="text-center mt-4">Build by SYS-OPS.ID</h6>
                <div id="output-container" class="mt-4">
                    <h4>Generated Script:</h4>
                    <pre id="output" class="script-box">${script}</pre>
                    <button id="copy-btn" class="btn btn-success w-100 mt-2">Copy Script</button>
                </div>
                <a href="/" class="btn btn-secondary w-100 mt-3">Generate Another Script</a>
            </div>

            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    let copyBtn = document.getElementById("copy-btn");
                    if (copyBtn) {
                        copyBtn.addEventListener("click", function() {
                            let text = document.getElementById("output").innerText;
                            let textArea = document.createElement("textarea");
                            textArea.value = text;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand("copy");
                            document.body.removeChild(textArea);
                            alert("Script copied to clipboard!");
                        });
                    }
                });
            </script>
        </body>
        </html>
    `);
});

app.listen(3030, () => {
    console.log("Server running on http://localhost:3030");
});
