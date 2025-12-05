"use strict";

const utils = require("../utils");
const axios = require("axios");

// Uploads an image to Facebook
async function postImage(api, userID, form) {
  const data = await api.httpPostFormData(
    `https://www.facebook.com/profile/picture/upload/?profile_id=${userID}&photo_source=57&av=${userID}`,
    form
  );
  return JSON.parse(data.split("for (;;);")[1]);
}

module.exports = function (defaultFuncs, api, ctx) {
  /**
   * Change the avatar of the bot
   * @param {Stream} fileStream - Image stream (from axios)
   * @param {String} caption - Optional caption
   * @param {Number|null} expiration - Expiration in ms (null = permanent)
   * @param {Function} callback - Optional callback
   */
  return async function changeAvatar(fileStream, caption = "", expiration = null, callback) {
    let resolveFunc, rejectFunc;
    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    try {
      // Step 1: Upload the image
      const uploaded = await postImage(api, ctx.userID, { file: fileStream });
      if (!uploaded?.payload?.fbid)
        return callback(new Error("Failed to upload image"));

      // Step 2: Set as profile picture
      const form = {
        av: ctx.userID,
        fb_api_req_friendly_name: "ProfileCometProfilePictureSetMutation",
        fb_api_caller_class: "RelayModern",
        // Centralized doc_id (easy to update if FB changes it)
        doc_id: process.env.FB_DOC_ID || "5066134240065849",
        variables: JSON.stringify({
          input: {
            caption,
            existing_photo_id: uploaded.payload.fbid,
            expiration_time: expiration, // can be null or ms
            profile_id: ctx.userID,
            profile_pic_method: "EXISTING",
            profile_pic_source: "TIMELINE",
            scaled_crop_rect: { height: 1, width: 1, x: 0, y: 0 },
            skip_cropping: true,
            actor_id: ctx.userID,
            client_mutation_id: Date.now().toString()
          },
          isPage: false,
          isProfile: true,
          scale: 3,
        }),
      };

      const res = await defaultFuncs
        .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
        .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

      if (res.error) return callback(res.error);
      return callback(null, true);
    } catch (err) {
      return callback(err);
    }

    return returnPromise;
  };
};
