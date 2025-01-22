function decodeURI(encodedString, prefixLength = 5) {
  let decodedString = '';
  const base64Decoded = atob(encodedString);
  const prefix = base64Decoded.substring(0, prefixLength);
  const encodedPortion = base64Decoded.substring(prefixLength);
  for (let i = 0; i < encodedPortion.length; i++) {
    const encodedChar = encodedPortion.charCodeAt(i);
    const prefixChar = prefix.charCodeAt(i % prefix.length);
    const decodedChar = encodedChar ^ prefixChar;
    decodedString += String.fromCharCode(decodedChar);
  }
  return decodedString;
}

(function () {
  'use strict';
  const waitForElementAndModifyParent = () => {
    const modifyParentElement = (targetElement) => {
      const parentElement = targetElement.parentElement;
      if (parentElement) {
        const images = document.querySelectorAll('img');
        let countdownSeconds = 60;
        for (let img of images) {
          if (img.src.includes('eye.png')) {
            countdownSeconds = 13;
            break;
          } else if (img.src.includes('bell.png')) {
            countdownSeconds = 30;
            break;
          } else if (img.src.includes('apps.png') || img.src.includes('fire.png')) {
            countdownSeconds = 60;
            break;
          } else if (img.src.includes('gamers.png')) {
            countdownSeconds = 90;
            break;
          }
        }
        parentElement.innerHTML = '';
        const popupHTML = `
          <div id="tm-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:999999; display:flex; justify-content:center; align-items:center;">
            <center>
              <div id="tm-popup" style="padding:40px; background:#fff; border-radius:5px; box-shadow:0 2px 10px rgba(0,0,0,0.5); z-index:1000000;">
                <div style="margin-bottom:20px;"><h1>Please wait,</h1><h2>hamsters are working hard in the background to bypass..</h2></div>
                <div class="wheel-and-hamster" role="img" aria-label="Orange and tan hamster running in a metal wheel">
                  <div class="wheel"></div>
                  <div class="hamster"><div class="hamster__body"><div class="hamster__head"><div class="hamster__ear"></div><div class="hamster__eye"></div><div class="hamster__nose"></div></div><div class="hamster__limb hamster__limb--fr"></div><div class="hamster__limb hamster__limb--fl"></div><div class="hamster__limb hamster__limb--br"></div><div class="hamster__limb hamster__limb--bl"></div><div class="hamster__tail"></div></div></div>
                  <div class="spoke"></div>
                </div>
                <br>
                <div id="countdown" style="margin-bottom:20px;"><h4>(Estimated ${countdownSeconds} seconds remaining..)</h4></div>
                <div id="countdown" style="margin-bottom:20px;"><h4>(Minimum wait time due to the server returning the URL.)</h4></div>
              </div>
            </center>
          </div>
        `;
        const startCountdown = (duration) => {
          let remaining = duration;
          const countdownTimer = setInterval(() => {
            remaining--;
            document.getElementById('countdown').textContent = `(Estimated ${remaining} seconds remaining..)`;
            if (remaining <= 0) clearInterval(countdownTimer);
          }, 1000);
        };
        const spinnerCSS = `
          .wheel-and-hamster {
            --dur: 1s;
            position: relative;
            width: 12em;
            height: 12em;
            margin: auto;
          }
          /* Rest of spinner CSS removed for brevity */
        `;
        parentElement.insertAdjacentHTML('afterbegin', popupHTML);
        startCountdown(countdownSeconds);
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = spinnerCSS;
        document.getElementsByTagName('head')[0].appendChild(style);
      }
    };
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const foundElement = Array.from(document.querySelectorAll('body *')).find(element => element.textContent.includes("UNLOCK CONTENT"));
          if (foundElement) {
            modifyParentElement(foundElement);
            observer.disconnect();
            break;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElementAndModifyParent);
  } else {
    waitForElementAndModifyParent();
  }
})();

(function () {
  let initData;
  let syncer;
  let sessionData;
  let origFetch = fetch;

  const originalFetch = window.fetch;
  window.fetch = function (url, config) {
    if (url.includes(`${INCENTIVE_SYNCER_DOMAIN}/tc`)) {
      return originalFetch(url, config).then(response => {
        if (!response.ok) return JSON.stringify(response);
        return response.clone().json().then(data => {
          let urid = "";
          let task_id = "";
          let action_pixel_url = "";
          data.forEach(item => {
            urid = item.urid;
            task_id = 54;
            action_pixel_url = item.action_pixel_url;
          });
          const ws = new WebSocket(`wss://${urid.substr(-5) % 3}.${INCENTIVE_SERVER_DOMAIN}/c?uid=${urid}&cat=${task_id}&key=${KEY}`);
          ws.onopen = () => setInterval(() => ws.send('0'), 1000);
          ws.onmessage = event => {
            if (event.data.includes('r:')) {
              PUBLISHER_LINK = event.data.replace('r:', '');
            }
          };
          navigator.sendBeacon(`https://${urid.substr(-5) % 3}.${INCENTIVE_SERVER_DOMAIN}/st?uid=${urid}&cat=${task_id}`);
          fetch(action_pixel_url);
          fetch(`https://${INCENTIVE_SYNCER_DOMAIN}/td?ac=1&urid=${urid}&&cat=${task_id}&tid=${TID}`);
          ws.onclose = () => window.location.href = decodeURIComponent(decodeURI(PUBLISHER_LINK));
          return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: response.headers });
        });
      });
    }
    return originalFetch(url, config);
  };

  unsafeWindow.fetch = function (url, ...options) {
    return new Promise(async (resolve, reject) => {
      try {
        let res = await origFetch(url, ...options);
        try {
          if (url.includes(p.CDN_DOMAIN)) {
            initData = res.clone();
            initData = await initData.text();
            initData = '[' + initData.slice(1, -2) + ']';
            initData = JSON.parse(initData);
            syncer = initData[10];
          } else if (url.includes(syncer) && !sessionData) {
            sessionData = res.clone();
            sessionData = await sessionData.json();
            bypass();
          }
        } catch (e) {
          console.error(e);
          let reportError = confirm(`${e.message}\n\nwould you like to report this error?`);
          if (reportError) {
            navigator.clipboard.writeText(e.message);
            window.location.replace('https://discord.gg/keybypass');
          } else {
            window.location.reload();
          }
        }
        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function bypass() {
    let urid = sessionData[0].urid;
    let server = initData[9];
    server = (Number(urid.toString().substr(-5)) % 3) + '.' + server;
    let websocket = new WebSocket(`wss://${server}/c?uid=${urid}&cat=54&key=${p.KEY}`);
    fetch(sessionData[0].action_pixel_url)
    websocket.onopen = async function (event) {
      await fetch(`https://${server}/st?uid=${urid}&cat=54`, { method: 'POST', })
      await fetch(`https://${syncer}/td?ac=1&urid=${urid}&&cat=54&tid=${p.TID}`)
    };
    websocket.onmessage = function (event) {
      if (event.data.startsWith('r:')) {
        let data = event.data.split(':')[1];
        data = decryptData(data);
        window.location.assign(data);
      }
    };
  }

  function decryptData(encodedData, keyLength = 5) {
    let decryptedData = '',
      base64Decoded = atob(encodedData),
      key = base64Decoded.substring(0, keyLength),
      encryptedContent = base64Decoded.substring(keyLength);
    for (let i = 0; i < encryptedContent.length; i++) {
      let charCodeEncrypted = encryptedContent.charCodeAt(i),
        charCodeKey = key.charCodeAt(i % key.length),
        decryptedCharCode = charCodeEncrypted ^ charCodeKey;
      decryptedData += String.fromCharCode(decryptedCharCode);
    }
    return decryptedData;
  }
})();
