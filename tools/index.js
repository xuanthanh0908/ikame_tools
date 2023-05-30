const {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
} = require("../tools/automate_ggAds");
const {
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
} = require("../tools/automate_add_Adgroup");
const {
  handFetchCreativePlaylist,
  handMultiFetchCreativePlaylist,
} = require("../tools/automate_addPlaylist");
const {
  handleFetchApi,
  handleMultiFetchApi,
} = require("../tools/automate_titktok");
const { scheduleRun } = require("../tools/automate_youtube");
module.exports = {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
  handleFetchApi,
  handleMultiFetchApi,
  handFetchCreativePlaylist,
  handMultiFetchCreativePlaylist,
  scheduleRun,
};
