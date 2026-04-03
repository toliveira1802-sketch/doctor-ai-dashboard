fetch('http://1.1.1.1').then(r=>console.log("HTTP OK", r.status)).catch(e=>console.log("HTTP FAIL", e.cause));
