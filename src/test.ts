import puppeteer from "puppeteer-extra";
import useProxy from "puppeteer-page-proxy";

const args = [
  "--window-size=1680,1220",
  "--disable-gpu",
  "--no-sandbox",
  "--enable-features=NetworkService,NetworkServiceInProcess",
  "--disable-dev-shm-usage",
  "--disable-infobars",
  "--disable-extensions",
  "--disable-setuid-sandbox",
  "--ignore-certifcate-errors",
  "--ignore-certifcate-errors-spki-list",
  // ...
  "--single-process",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--force-gpu-mem-available-mb=1024",
];

const options = {
  args,
  ignoreDefaultArgs: ["--enable-automation"],
  headless: false,
  slowMo: 120,
  // defaultViewport: null,
  ignoreHTTPSErrors: true,
  // userDataDir: "./tmp",
  defaultViewport: {
    width: 1648,
    height: 1099,
  },
};

(async () => {
  const browser = await puppeteer.launch(options);

  const page = await browser.newPage();
  page.goto("https://2ip.ru/", {});

  const page2 = await browser.newPage();
  await useProxy(page2, "http://127.0.0.1:80");
  page2.goto("https://2ip.ru/", {});

  //   for (let i = 0; i < 30; ++i) {
  //     console.log("start " + i);
  //     const page = await browser.newPage();
  //     // const page = (await browser.pages())[0];

  //     page.goto("https://yandex.ru/", {
  //       //   waitUntil: "networkidle2",
  //     });

  //     // await new Promise((res) => setTimeout(res, 1e2));
  //   }

  await new Promise((res) => setTimeout(res, 3e4));
})();
