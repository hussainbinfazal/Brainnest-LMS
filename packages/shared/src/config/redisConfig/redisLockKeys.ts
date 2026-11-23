// export const USER_EMAIL_VERIFIED_FLAG = {
//     namespace: 'user-email-verified',
//     id: 'email',
//     ttl: 'MEDIUM', //15 minute USER_EMAIL_VERIFIED_FLAGs
//     description: 'To get reset password email status ',
//     usedIn: ['Password reset API email status'],
// };
export const USER_UPDATE_PROFILE_LOCK = {
    namespace: 'lock:update-profile',
    id: 'userId',
    ttl: 'MEDIUM', //15 minute USER_UPDATE_VERIFIEDLOCK_
    description: 'To lock user while updating the user details, and also to prevent lock conditions ',
    usedIn: ['Update Profile API'],
};