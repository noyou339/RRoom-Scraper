const puppeteer = require("puppeteer");
const express = require("express");
require('dotenv').config();
const axios = require('axios');

var fs   = require('fs');

async function test(age) {
  var random = Math.floor(Math.random() * 34) + 1;
  var requestUrl = "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601?applicationId=" + process.env.RAKUTEN_APP_ID
    + "&age=" + age + "&sex=1&carrier=0&page=" + random;
  console.log(requestUrl);
  await axios.get(requestUrl, {

  }).then(async (response) => {
    if (response.status !== 201) {
      for (var i = 0; i < response.data.Items.length; i++) {
        var itemCode = response.data.Items[i].Item.itemCode;
        var itemName = response.data.Items[i].Item.itemName;
        var catchcopy = response.data.Items[i].Item.catchcopy;
        var description = response.data.Items[i].Item.itemCaption;
        console.log((i + 1).toString() + "件目スタート");
        console.log(itemCode);
        console.log(description);
        await post(itemCode, description, itemName, catchcopy);
        console.log("完了");
      }

    }
  }).catch((error) => {
    console.log(error);
    return;
  });

}


// test(20);
var args = [
  20,
  30,
  40
]
var ageNo = args[Math.floor(Math.random()* args.length)];
try {
  test(ageNo);
} catch (error){ 
  // var dateTime = new Date().toISOString() 
  // fs.writeFileSync("." + dateTime + '.txt', error);
}




// test(40);




async function post(itemCode, description, itemName, catchcopy) {
  try {
    const browser = await puppeteer.launch({
      // headless: "new", defaultViewport: {
      //   width: 800, height: 1600
      // }
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    // await page.setUserAgent(
    //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    // );

    const url = `https://room.rakuten.co.jp/mix?itemcode=${itemCode}&scid=we_room_upc60`;

    console.log(url);

    // await page.goto(url, {waitUntil: 'networkidle0'});
    await page.goto(url);
    const userId = process.env.RAKUTEN_USER_ID
    const password = process.env.RAKUTEN_PASSWORD;

    // ログイン処理
    const xpathId = "xpath=/html/body/div[2]/div/div/div[1]/div/form/div/table/tbody/tr[1]/td[2]/input";
    const xpathPassword = "xpath=/html/body/div[2]/div/div/div[1]/div/form/div/table/tbody/tr[2]/td[2]/input"
    await page.waitForSelector(xpathId, {visible: true});
    await page.focus(xpathId,);
    await page.type(xpathId, userId);
    await page.waitForSelector(xpathPassword, {visible: true});
    await page.focus(xpathPassword);
    await page.type(xpathPassword, password);
    await page.click('input[value="ログイン"]');
    // ログイン後のページ遷移を待つ
    await page.waitForSelector("#collect-content", {
      visible: true,
    });

    // コレ！済みの場合は、処理を終了
    let modalElement = null;
    try {
      await page.waitForSelector(".modal-dialog-container", {
        visible: true,
        timeout: 500,
      });
      modalElement = await page.$(".modal-dialog-container");
    } catch (error) { }
    if (modalElement) {
      console.log("「すでにコレしている商品です」のため処理を終了");
      await browser.close();
      return;
    }

    var descriptionCut = itemName + catchcopy + description.substring(0, 200) + " #あったら便利 #欲しいものリスト #ランキング #人気 #楽天市場";
    console.log(descriptionCut);
    //　投稿処理
    await page.waitForSelector("#collect-content", {
      visible: true,
    });
    await page.click("#collect-content");
    await page.type("#collect-content", descriptionCut, { delay: 100 });

    await page.waitForSelector("button", { visible: true });
    await page.click('xpath=//*[@id="scroller"]/div[4]/div[6]/div[1]/button', {
      visible: true,
    });

    await browser.close();
  } catch (error) {
    console.log(error);
    return;
  }


}


// const app = express();

// app.get("/", (req, res) => {
//     try {
//         test()
//         console.log("ログ定期実行")

//     } catch (err) {
//         console.log(err);
//     }
//     res.send('get');
// });


// const PORT = process.env.PORT || 3000;
// app.listen(PORT);