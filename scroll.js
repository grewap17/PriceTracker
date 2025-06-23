chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' }, function(info)  {
        
    console.log("User Email:", info.email);
    console.log("User ID:", info.id);
  });