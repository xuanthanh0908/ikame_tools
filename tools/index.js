const {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
} = require("../tools/automate_ggAds");
const {
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
} = require("../tools/automate_add_Adgroup");
const {
  handleFetchApi,
  handleMultiFetchApi,
} = require("../tools/automate_titktok");
const { scheduleRun } = require("../tools/automate_youtube");
const {
  handMultiFetchMintegralRemovedCreative,
  handleFetchMintegralRemoveCreative,
} = require("../tools/automate_mintegral_remove_creative");
module.exports = {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
  handleFetchApi,
  handleMultiFetchApi,
  scheduleRun,
  handMultiFetchMintegralRemovedCreative,
  handleFetchMintegralRemoveCreative,
};
