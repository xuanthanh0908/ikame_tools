const {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
} = require("../tools/automateAddCampaignGoogleAds");
const {
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
} = require("../tools/automateAddAdsGroup");
const {
  handleFetchApi,
  handleMultiFetchApi,
} = require("../tools/automateAddCampaignTiktok");
const { scheduleRun } = require("../tools/automateUploadVideoToYoutube");
const {
  handMultiFetchMintegralRemovedCreative,
  handleFetchMintegralRemoveCreative,
} = require("../tools/automateDeletedCreativeMintegral");
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
