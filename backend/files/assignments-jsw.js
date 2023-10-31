import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const authOptions = { suppressAuth: true };
const suppressHooksandAuth = { suppressAuth: true, suppressHooks: true };

export async function gradeAssignment(assignment, allactivities, submission) {
    let gradingComplete = true;
    let totalAssignmentScore = 0;
    allactivities.forEach((activityobj) => {
        //const activityScoringDetailsobj = assignment.scoringDetails.filter(obj => obj._id === activityobj._id)[0];
        let totalActivityScore = 0;
        if (activityobj.type === 'Quiz') {
            activityobj.data.forEach((questionobj) => {
                const submissionarray = submission.data.filter(obj => obj._id === activityobj._id);
                if (submissionarray.length > 0) {
                    let gradingQuestionComplete = true;
                    const responseobj = submissionarray[0].questions.filter(obj => obj._id === questionobj._id)[0];
                    //const questionScoringDetails = activityScoringDetailsobj.questions.filter(obj => obj._id === questionobj._id)[0];
                    //const questionTypes = ["Quiz", ""]
                    switch (questionobj.type) {
                    case 'radio':
                        if (questionobj.answer === responseobj.response) {
                            totalActivityScore = totalActivityScore + (1 / activityobj.data.length);
                        }
                        break;
                    case 'dropdown':
                        if (questionobj.answer === responseobj.response) {
                            totalActivityScore = totalActivityScore + (1 / activityobj.data.length);
                        }
                        break;
                    case 'checkbox':
                        if (questionobj.answer === responseobj.response) {
                            totalActivityScore = totalActivityScore + (1 / activityobj.data.length);
                        }
                        break;
                    case 'text':
                        let assignmentGroup;
                        if (assignment.assignData.some((obj) => obj.students.includes(submission._owner))) {
                            assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(submission._owner));
                        } else {
                            assignmentGroup = assignment.assignData[0];
                        }
                        if (!assignmentGroup.grading.manualGrading) {
                            totalActivityScore = totalActivityScore + (1 / activityobj.data.length);
                        } else {
                            gradingQuestionComplete = false;
                        }
                        break;
                    case 'matching':
                        break;
                    }
                    if (gradingQuestionComplete) {
                        totalAssignmentScore = totalAssignmentScore + (totalActivityScore / allactivities.items);
                    } else {
                        gradingComplete = false;
                    }
                }
            })
        } else {
            totalAssignmentScore = totalAssignmentScore + (1 / allactivities.items);
        }
    });
    return { result: true, totalAssignmentScore: totalAssignmentScore, gradingStatus: gradingComplete };
}

export async function fetchAssignmentStudents(assignmentClass) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignmentClass, memberId, authOptions);
    if (isAuthorized) {
        const students = await wixData.queryReferenced("Classes", assignmentClass, "students");
        return { items: students.items, totalCount: students.totalCount };
    } else {
        throw new Error("You don't have access to this class.");
    }
}

export async function saveAssignment(assignment) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], memberId, authOptions);
    if (isAuthorized) {
        return wixData.save("Assignments", assignment, { suppressAuth: true }).then(() => {
            Promise.resolve();
        }).catch((error) => {
            throw new Error(error);
        })
    } else {
        throw new Error("You don't have access to this class.");
    }
}

export async function fetchAssignmentActivities(assignment) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], memberId, authOptions);
    if (isAuthorized) {
        const activities = await wixData.queryReferenced("Assignments", assignment._id, "Activities", authOptions);;
        return { totalCount: activities.totalCount, items: activities.items };
    } else {
        throw new Error("You don't have access to this class.");
    }
}

export async function insertAssignmentActivity(assignment, activities) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], memberId, authOptions);
    if (isAuthorized) {
        return wixData.insertReference("Assignments", "Activities", assignment._id, activities, authOptions).then(() => {
            Promise.resolve();
        }).catch((error) => {
            throw new Error(error);
        })
    } else {
        throw new Error("You don't have access to this class.");
    }
}

export async function removeAssignmentActivity(assignment, activities) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], memberId, authOptions);
    if (isAuthorized) {
        return wixData.removeReference("Assignments", "Activities", assignment._id, activities, authOptions).then(() => {
            return Promise.resolve();
        }).catch((error) => {
            throw new Error(error);
        })
    } else {
        throw new Error("You don't have access to this class.");
    }
}

export async function replaceAssignmentActivity(assignment, activities) {
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], memberId, authOptions);
    if (isAuthorized) {
        return wixData.replaceReferences("Assignments", "Activities", assignment._id, activities, authOptions).then(() => {
            return Promise.resolve();
        }).catch((error) => {
            return Promise.reject(error);
        });
    } else {
        return Promise.reject();
    }
}

export async function updateAssignmentActivityOrder(assignment, reorderedarray) {
    assignment.activityOrder = reorderedarray;
    const memberId = (await currentMember.getMember())._id;
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], memberId, authOptions);
    if (isAuthorized) {
        return wixData.update("Assignments", assignment, authOptions).then(() => {
            return Promise.resolve();
        }).catch((error) => {
            return Promise.reject(error);
        });
    } else {
        return Promise.reject();
    }
}

export async function fetchAssignmentSubmissions(classes, assignments, students) {
    const member = await currentMember.getMember();
    const authorizedClassesList = await wixData.query("Classes").hasSome("instructors", member._id).find({ suppressAuth: true });
    let authorizedClassIds = authorizedClassesList.items.map((obj) => obj._id);
    if (classes) {
        authorizedClassIds.filter((obj) => classes.includes(obj._id));
    }
    const authorizedAssignmentsQuery = await wixData.query("Assignments").hasSome('class', authorizedClassIds).find({ suppressAuth: true });
    const authorizedAssignmentIds = authorizedAssignmentsQuery.items.map((obj) => obj._id);
    let dataQuery = wixData.query("AssignmentSubmissions").hasSome("assignment", authorizedAssignmentIds).eq("submitted", true);
    if (assignments) {
        dataQuery = dataQuery.hasSome("assignment", assignments)
    }
    if (students) {
        dataQuery = dataQuery.hasSome("_owner", students)
    }
    let results = await dataQuery.find({ suppressAuth: true });
    let allItems = results.items
    while (results.hasNext()) {
        results = await results.next();
        allItems = allItems.concat(results.items);
    }
    return allItems;
}

export async function fetchAllUserAssignments() {
    const member = await currentMember.getMember();
    let classResults = await wixData.query("Classes").hasSome("instructors", member._id).find(suppressHooksandAuth);
    let allClassResults = classResults.items;
    while (classResults.hasNext()) {
        classResults = await classResults.next();
        allClassResults = allClassResults.concat(classResults.items);
    }
    const classIdList = allClassResults.map((obj) => obj._id);
    let assignmentResults = await wixData.query("Assignments").hasSome("class", classIdList).find(suppressHooksandAuth);
    let allAssignmentResults = assignmentResults.items;
    while (assignmentResults.hasNext()) {
        assignmentResults = await assignmentResults.next();
        allAssignmentResults = allAssignmentResults.concat(assignmentResults.items);
    }
    return allAssignmentResults;
}
