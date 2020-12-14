chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "getPhotoIds" }, ids => {
      getImages(ids);
    });
  });
});

const imageUrlPrefix = "https://m.facebook.com/photo/view_full_size/?fbid=";

async function getImages(ids) {
  let baseDate = new Date(2006, 0, 1);

  ids.reverse();

  for (let id of ids) {
    const response = await fetch(imageUrlPrefix + id);
    const text = await response.text();
    const pattern = /(?<=url=).*?(?=")/g;
    const imageUrl = pattern.exec(text)[0].replace(/&amp;/g, "&");

    const imageResponse = await fetch(imageUrl);
    let lastModifiedDate = new Date(imageResponse.headers.get("last-modified"));

    if (lastModifiedDate.getTime() === 0) {
      baseDate.setSeconds(baseDate.getSeconds() + 1);
      lastModifiedDate = baseDate;
    }

    const imageBlob = await imageResponse.blob();

    const reader = new FileReader();
    reader.onloadend = () => {
      let dataUrl = reader.result;

      const exifStr = piexif.dump({
        Exif: {
          [piexif.ExifIFD.DateTimeOriginal]: fecha.format(
            lastModifiedDate,
            "YYYY:MM:DD HH:mm:ss"
          )
        }
      });
      dataUrl = piexif.insert(exifStr, dataUrl);

      chrome.downloads.download({
        url: dataUrl,
        filename: `Facebook Photos/${id}.jpg`,
        conflictAction: "overwrite"
      });
    };
    reader.readAsDataURL(imageBlob);
  }
}
