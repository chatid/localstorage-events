module.exports = function() {
  // http://stackoverflow.com/questions/1134290/cookies-on-localhost-with-explicit-domain
  if (location.hostname === 'localhost') {
    return null;
  // IP address
  } else if (/[\d]+\.[\d]+\.[\d]+/.test(location.hostname)) {
    return location.hostname;
  // Otherwise assume domain with one dot (e.g. "site.com" yes, "site.co.uk" no)
  } else {
    return location.hostname.split('.').slice(-2).join('.');
  }
};
