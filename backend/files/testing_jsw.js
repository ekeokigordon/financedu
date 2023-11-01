import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

export async function redeemHours(sessionItems) {
    const member = await currentMember.getMember()
    const filteredSessionItems = sessionItems.filter((obj) => !obj.redeemed);
    let updatedSessionItems = filteredSessionItems.map((obj) => { return { ...obj, redeemed: true } });
    const updatedSessionItemsIdList = filteredSessionItems.map((obj) => obj._id);
    let totalSessionSeconds = 0;
    updatedSessionItems.forEach((obj) => {
        const millisecondDiff = new Date(obj.endDate).getTime() - new Date(obj.startDate).getTime();
        const totalSeconds = Math.floor(millisecondDiff / 1000);
        totalSessionSeconds += totalSeconds;
    });
    const oldestDateObj = updatedSessionItems.reduce((r, o) => o.startDate < r.startDate ? o : r);
    const newestDateObj = updatedSessionItems.reduce((r, o) => r.endDate < o.endDate ? o : r);
    return Promise.all([wixData.bulkUpdate("TestingSessions", updatedSessionItems),
        wixData.insert("TestingSessionRedeems", { "memberId": member._id, "totalTime": totalSessionSeconds, "startDate": new Date(oldestDateObj.startDate), "endDate":  new Date(newestDateObj.endDate)})
    ]).then((results) => {
        return wixData.insertReference("TestingSessionRedeems", "testingSessions", results[1]._id, filteredSessionItems).then(() => {
            return Promise.resolve();
        });
    });
}
