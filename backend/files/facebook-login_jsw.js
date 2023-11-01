import { FacebookOAuth } from '@openauth/facebook';
import { getSecret } from 'wix-secrets-backend';
import { generateToken, socialLoginUpdateMember } from 'backend/memberFunctions/members.jsw';

export async function getFBAuthUrl() {
    const fbclientId = await getSecret('facebook-oauth-clientId');
    const fbclientSecret = await getSecret('facebook-oauth-clientSecret');
    const oauth = new FacebookOAuth({
        clientId: fbclientId,
        clientSecret: fbclientSecret,
        redirectUri: 'https://prospectorminerals.com/fblogin',
        scope: [
            'public_profile',
            'email'
        ],
    })
    return oauth.getAuthRequestUri();
    /*
    return `https://www.facebook.com/v12.0/dialog/oauth?client_id=658815435476602&redirect_uri=https:/prospectorminerals.com/_functions/getFBAuth&state=123456780`
    */
}

export async function fbLogin(code) { 
    const fbclientId = await getSecret('facebook-oauth-clientId');
    const fbclientSecret = await getSecret('facebook-oauth-clientSecret');
    const oauth = new FacebookOAuth({
        clientId: fbclientId,
        clientSecret: fbclientSecret,
        redirectUri: 'https://prospectorminerals.com/fblogin',
        scope: [
            'public_profile',
            'email'
        ],
    })
    const response = await oauth.getAccessTokenResponse(code);
    console.log(response);
    const user = await oauth.getAuthUser(response.accessToken);
    console.log(user);
    const namearray = user.name.split(" ");
    const firstName = namearray[0];
    const lastName = namearray[1];
    return generateToken(user.email, {firstName: firstName, lastName: lastName, picture: user.avatar})
    .then( (tokendata) => {
        //socialLoginUpdateMember({name: user.name, avatar: user.avatar});
        return `https://prospectorminerals.com/social-login?FBsessionToken=${tokendata.sessionToken}`
    }).catch( (err) => {
        if (!user.email){
            return `https://www.facebook.com/v15.0/dialog/oauth?client_id=${fbclientId}&redirect_uri=https://prospectorminerals.com/fblogin&auth_type=rerequest&scope=email`;
        }
    }); 
} 

/*
export function giveUser(code) {
return getFBToken(code)
.then( (accessToken) => {
    console.log('token' + accessToken);
    return getUserData(accessToken)
  .then( (email) => {
      console.log('email' + email);
    return generateToken(email)
    .then( (tokendata) => {
        console.log('tokenData' + tokendata);
        console.log('tokenData' + tokendata.sessionToken);
        return tokendata.sessionToken;
    }).catch( (err) => {
        console.log('Unable to Generate Session Token - '+err);
    } ); 
  })
  .catch( (err) => {
        console.log('Unable to Get User Data - '+err);
    } );  
})
.catch( (err) => {
        console.log('Unable to Fetch Access Code - '+ err);
    } );  
}

async function getFBToken(code) {
     //setTimeout(async function() {
  const response = await oauth.getAccessTokenResponse(code)
  let accessToken = response.accessToken
  return accessToken;
    //}, 100);
}

async function getUserData(accessToken) {
    //setTimeout(async function() {
    const user = await oauth.getAuthUser(accessToken)
    return user.email;
    //}, 100);
}
*/
