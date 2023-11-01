import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const suppressHooksandAuth = { suppressAuth: true, suppressHooks: true };

export async function queryOrganizationsbyCode(code) {
    return wixData.query('Organizations').eq("code", code).find(suppressHooksandAuth).then((res) => {
        if (res.items.length > 0) {
            return {status: true, classitem: res.items[0]};
        } else {
            return {status: false};
        } 
    }).catch(() => {
        throw new Error('classNotFound');
    })
}

export function addStafftoOrganization(classId, userId) {
    return wixData.insertReference("Organizations", "staff", classId, userId, { suppressAuth: true })
        .then(() => {
            return { status: true };
        }).catch((error) => {
            return { status: false, error: error };
        })
}

export async function fetchStatistics(organizationId) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Organizations", "administrators", organizationId, memberId, suppressHooksandAuth);
    if (isAuthorized) {
        let subOrganizationsQuery = await wixData.queryReferenced("Organizations", organizationId, "subOrganizations");
        let allSuborganizations = subOrganizationsQuery.items;
        while (subOrganizationsQuery.hasNext()) {
            subOrganizationsQuery = await subOrganizationsQuery.next();
            allSuborganizations = allSuborganizations.concat(subOrganizationsQuery.items);
        }
        const subOrganizationIdList = allSuborganizations.map((obj) => obj._id);
        const combinedOrganizationList = [organizationId].concat(subOrganizationIdList);
        const instructorCount = await wixData.query("People").hasSome("Organizations-1", combinedOrganizationList).count(suppressHooksandAuth);
        let classesQuery = await wixData.query("Classes").hasSome("organization", combinedOrganizationList).find(suppressHooksandAuth);
        let allClassItems = classesQuery.items;
        while (classesQuery.hasNext()) {
            classesQuery = await classesQuery.next();
            allClassItems = allClassItems.concat(classesQuery.items);
        }
        const classIdList = allClassItems.map((obj) => obj._id);
        const classCount = classesQuery.totalCount;
        const studentCount = await wixData.query("People").hasSome("Classes-1", classIdList).count(suppressHooksandAuth);
        return { instructorCount: instructorCount, classCount: classCount, studentCount: studentCount };
    } else {
        throw new Error("unauthorized");
    }
}

export async function fetchPeople(organizationId) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Organizations", "administrators", organizationId, memberId, suppressHooksandAuth);
    if (isAuthorized) {
        let subOrganizationsQuery = await wixData.queryReferenced("Organizations", organizationId, "subOrganizations");
        let allSuborganizations = subOrganizationsQuery.items;
        while (subOrganizationsQuery.hasNext()) {
            subOrganizationsQuery = await subOrganizationsQuery.next();
            allSuborganizations = allSuborganizations.concat(subOrganizationsQuery.items);
        }
        const subOrganizationIdList = allSuborganizations.map((obj) => obj._id);
        const combinedOrganizationList = [organizationId].concat(subOrganizationIdList);
        let adminQuery = await wixData.queryReferenced("Organizations", organizationId, "administrators", suppressHooksandAuth);
        let allAdminItems = adminQuery.items;
        while (adminQuery.hasNext()) {
            adminQuery = await adminQuery.next();
            allAdminItems = allAdminItems.concat(adminQuery.items);
        }
        let instructorQuery = await wixData.query("People").hasSome("Organizations-1", combinedOrganizationList).find(suppressHooksandAuth);
        let allInstructorItems = instructorQuery.items;
        while (instructorQuery.hasNext()) {
            instructorQuery = await instructorQuery.next();
            allInstructorItems = allInstructorItems.concat(instructorQuery.items);
        }
        let classesQuery = await wixData.query("Classes").hasSome("organization", combinedOrganizationList).find(suppressHooksandAuth);
        let allClassItems = classesQuery.items;
        while (classesQuery.hasNext()) {
            classesQuery = await classesQuery.next();
            allClassItems = allClassItems.concat(classesQuery.items);
        }
        const classIdList = allClassItems.map((obj) => obj._id);
        let studentQuery = await wixData.query("People").hasSome("Classes-1", classIdList).find(suppressHooksandAuth);
        let allStudentItems = studentQuery.items;
        while (studentQuery.hasNext()) {
            studentQuery = await studentQuery.next();
            allStudentItems = allStudentItems.concat(studentQuery.items);
        }
        return { administrators: allAdminItems, instructors: allInstructorItems, students: allStudentItems };
    } else {
        throw new Error("unauthorized");
    }
}
