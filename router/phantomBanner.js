const express = require("express"),
  router = express(),
  phantom = require("phantom"),
  fs = require("fs");

const writeFile = (path, data, opts = "utf8") =>
  new Promise((res, rej) => {
    fs.writeFile(path, data, opts, err => {
      if (err) rej(err);
      else res();
    });
  });

const readFile = (path, opts = "utf8") =>
  new Promise((res, rej) => {
    fs.readFile(path, opts, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });

async function getBanner() {
  const instance = await phantom.create();
  const page = await instance.createPage();
  const status = await page.open("http://music.163.com/");
  await page.switchToFrame("contentFrame").then(
    function() {
      page.property("frameContent").then(async res => {
        const reg = /window.Gbanners\s*=\n(\[[^]*\]);\s*\n<\/script>/i;
        let banner = reg.exec(res)[1];
        banner = { code: 200, banners: eval(banner) };
        await writeFile("banner.json", JSON.stringify(banner));
        console.log("phantom caught !");
        await instance.exit();
      });
    },
    err => {
      console.log("phantom error");
      instance.exit();
    }
  );
}
const frequency = 86400000;
getBanner();
setInterval(getBanner, frequency);

router.get("/", (req, res) => {
  readFile("banner.json").then(
    result => res.send(result),
    err => res.status(502).send("read error")
  );
});

module.exports = router;
