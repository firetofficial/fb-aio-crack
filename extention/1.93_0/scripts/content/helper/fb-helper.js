export function wrapGraphQlParams(params) {
  const formBody = [];
  for (const property in params) {
    const encodedKey = encodeURIComponent(property);
    const value =
      typeof params[property] === "string"
        ? params[property]
        : JSON.stringify(params[property]);
    const encodedValue = encodeURIComponent(value);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  return formBody.join("&");
}

export async function fetchGraphQl(params, fb_dtsg) {
  let form;
  fb_dtsg = fb_dtsg || (await getFbdtsg());
  if (typeof params === "string")
    form =
      "fb_dtsg=" +
      encodeURIComponent(fb_dtsg) +
      "&q=" +
      encodeURIComponent(params);
  else
    form = wrapGraphQlParams({
      dpr: 1,
      __a: 1,
      __aaid: 0,
      __ccg: "GOOD",
      __comet_req: 15, // reduce a lot of data in extensions response
      server_timestamps: true,
      fb_dtsg,
      ...params,
    });

  let res = await fetch(
    "https://" +
      (location.hostname.includes("facebook.com")
        ? location.hostname
        : "www.facebook.com") +
      "/api/graphql/",
    {
      body: form,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
    }
  );

  let json = await res.text();
  return json;
}
export async function getFbdtsg() {
  let methods = [
    () => require("DTSGInitData").token,
    () => require("DTSG").getToken(),
    () => {
      return RegExp(/"DTSGInitialData",\[],{"token":"(.+?)"/).exec(
        document.documentElement.innerHTML
      )?.[1];
    },
    async () => {
      let res = await fetch("https://mbasic.facebook.com/photos/upload/");
      let text = await res.text();
      return RegExp(/name="fb_dtsg" value="(.*?)"/).exec(text)?.[1];
    },
    async () => {
      let res = await fetch("https://m.facebook.com/home.php", {
        headers: {
          Accept: "text/html",
        },
      });
      let text = await res.text();
      return (
        RegExp(/"dtsg":{"token":"([^"]+)"/).exec(text)?.[1] ||
        RegExp(/"name":"fb_dtsg","value":"([^"]+)/).exec(text)?.[1]
      );
    },
    () => require("DTSG_ASYNC").getToken(), // TODO: trace xem tại sao method này trả về cấu trúc khác 2 method trên
  ];
  for (let m of methods) {
    try {
      let d = await m();
      if (d) return d;
    } catch (e) {}
  }
  return null;
}

export const TargetType = {
  User: "user",
  Page: "page",
  Group: "group",
  IGUser: "ig_user",
  TikTokUser: "tiktok_user",
  ThreadsUser: "threads_user",
};

export async function getEntityAbout(entityID, context = "DEFAULT") {
  const { deepFind } = await import("./helper.js");

  let res = await fetchGraphQl({
    fb_api_req_friendly_name: "CometHovercardQueryRendererQuery",
    variables: {
      actionBarRenderLocation: "WWW_COMET_HOVERCARD",
      context: context,
      entityID: entityID,
      // includeTdaInfo: false,
      scale: 2,
    },
    // doc_id: '7257793420991802'
    doc_id: "27838033792508877",
  });
  const json = JSON.parse(res);
  const node = json?.data?.node;
  if (!node) return null; // throw new Error("Wrong ID / Entity not found");

  const typeText = node.__typename.toLowerCase();
  if (!Object.values(TargetType).includes(typeText)) return null; //throw new Error("Not supported type: " + typeText);

  const card = node.comet_hovercard_renderer[typeText];

  let type;
  if (typeText === "page") type = TargetType.Page;
  else if (typeText !== "user") type = TargetType.Group;
  else if (
    card.profile_plus_transition_path?.startsWith("PAGE") ||
    card.profile_plus_transition_path === "ADDITIONAL_PROFILE_CREATION"
  )
    type = TargetType.Page;
  else type = TargetType.User;

  const uid = node.id || card.id;
  return {
    type,
    pageId: deepFind(card, "delegate_page_id"),
    uid,
    name: card.name,
    avatar: card.profile_picture.uri,
    url: card.profile_url || card.url,
    raw: json,
  };
}
