import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const suppressHooksandAuth = { suppressAuth: true, suppressHooks: true };

export async function queryClassesbyCode(code) {
    return wixData.query('Classes').eq("code", code).find(suppressHooksandAuth).then((res) => {
        if (res.items.length > 0) {
            return {status: true, classitem: res.items[0]};
        } else {
            return {status: false};
        } 
    }).catch(() => {
        throw new Error('classNotFound');
    })
}

export function addStudenttoClass(classId, userId) {
    return wixData.insertReference("Classes", "students", classId, userId, { suppressAuth: true })
        .then(() => {
            return { status: true };
        }).catch((error) => {
            throw new Error(error);
        })
}

export async function getClassPeople(classId) {
    try {
        const memberId = (await currentMember.getMember())._id;
        const students = await wixData.queryReferenced("Classes", classId, "students");
        const studentsData = {
            "items": students.items,
            "totalCount": students.totalCount
        };
        const instructors = await wixData.queryReferenced("Classes", classId, "instructors");
        const instructorsData = {
            "items": instructors.items,
            "totalCount": instructors.totalCount
        };
        const peopleArray = students.items.concat(instructors.items);
        const peopleIdArray = peopleArray.map((obj) => obj._id);
        if (peopleIdArray.includes(memberId)) {
            return { students: studentsData, instructors: instructorsData };
        } else {
            return Promise.reject("Not authorized to view class.")
        }
    } catch (error) {
        throw new Error(error);
    }
}

export async function inserts() {
    const memberId = (await currentMember.getMember())._id;
    return wixData.insert("People", { "_id": memberId }).then((res) => {
        return res;
    }).catch((error) => {
        return Promise.reject(error) //throw new Error(error);
    })
}

export async function testFunction() {
    const res = await wixData.query("Activities").find();
    return res
}

export async function leaveClassStudent(classId) {
    const member = await currentMember.getMember();
    const assignments = await wixData.query("Assignments").eq("class", classId).find(suppressHooksandAuth);
    const assignmentsIdList = assignments.items.map((obj) => obj._id);
    const assignmentSubmissions = await wixData.query("AssignmentSubmissions").hasSome("assignment", assignmentsIdList).find(suppressHooksandAuth);
    const assignmentSubmissionsIdList = assignmentSubmissions.items.map((obj) => obj._id);
    return Promise.all([wixData.bulkRemove("AssignmentSubmissions", assignmentSubmissionsIdList, suppressHooksandAuth), 
    wixData.removeReference("Classes", "students", classId, member._id, suppressHooksandAuth)]).then(() => {
        return Promise.resolve();
    })
}

export async function leaveClassInstructor(classId) {
    const member = await currentMember.getMember();
    wixData.removeReference("Classes", "instructors", classId, member._id, suppressHooksandAuth).then(() => {
        return Promise.resolve();
    })
}
