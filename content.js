chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let ids = [];
  for (link of document.getElementsByTagName("a")) {
    if (!link.href.includes("?fbid=")) continue;
    ids.push(new URL(link.href).searchParams.get("fbid"));
  }

  sendResponse(ids);
});
