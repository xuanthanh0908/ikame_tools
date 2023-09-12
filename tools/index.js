const {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
} = require("../tools/automateAddCampaignGoogleAds");
const {
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
} = require("../tools/automateAddAdsgroupWithUrl");
const {
  handleFetchApi,
  handleMultiFetchApi,
} = require("../tools/automateAddCampaignTiktok");
const { scheduleRun } = require("../tools/automateUploadVideoToYoutube");
const {
  handMultiFetchMintegralRemovedCreative,
  handleFetchMintegralRemoveCreative,
} = require("../tools/automateDeletedCreativeMintegral");

const {
  handleRunMultipleMain,
} = require("../tools/automateFillPlaceholderInAdjust");
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
  handleRunMultipleMain,
};
