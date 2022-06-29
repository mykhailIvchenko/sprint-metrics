import ForgeUI, {
    Fragment,
    Macro,
    MacroConfig,
    render,
    Text,
    TextField,
    useConfig,
    useState,

} from "@forge/ui";

import api, {route, startsWith, storage} from "@forge/api";

import {AddCommentModalDialog} from "./sprintMetricDialog";

import {getComments} from "./storage";

import {SprintMetricsTable} from "./sprintMetricsTable";
import {AddMultipleCommentModalDialog} from "./sprintMetricMultipleParamDialog";


const defaultConfig = {
    sprintId: null,
};

function Velocity(name, commitmentsSP, completedSP, commitmentsUS, completedUS, completeDate, startDate, endDate, goal) {
    this.commitments = commitmentsSP;
    this.completed = completedSP;
    this.commitmentsUS = commitmentsUS;
    this.completedUS = completedUS;
    this.name = name;
    this.completeDate = completeDate;
    this.startDate = startDate;
    this.endDate = endDate;
    this.goal = goal;
}

function getIssues(sprint, previousSprints) {
    const sprintIds = previousSprints.map(sprint => sprint.id);
    return issuesBySprintIds(sprintIds, sprint);
}

function getPreviousSprintsBySprintId(target) {
    const allSprints = useState(getAllSprints(target.originBoardId));

    if (!allSprints) return [];

    return allSprints
        .filter(x => x)
        .flatMap(allSprintsResponse => allSprintsResponse.values)
        .filter(x => x)
        .filter(sprint => sprint.startDate)
        .filter(sprint => extractDateFromTimeStamp(sprint.startDate) <= extractDateFromTimeStamp(target.startDate))
        .sort((sprint1, sprint2) => sprint1.startDate - sprint2.startDate)
        .reverse()
        .slice(0, 5);
}

const issuesBySprintIds = async (sprintIds, projectKey) => {
    console.log(route`/rest/api/3/search?jql=sprint in closedSprints() and sprint in (${sprintIds})&expand=changelog`);
    const response = await api.asApp().requestJira(route`/rest/api/3/search?jql=sprint in closedSprints() and sprint in (${sprintIds})&expand=changelog`);

    const result = await response.json();

    if (!result ||
        (Object.keys(result).length === 0 && result.constructor === Object) ||
        result === "") {
        return null;
    }
    return result.issues;
}

const getAllSprints = async (boardId) => {
    const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=closed`);

    if(!response.ok) return null;

    return response.json();
}

const getSprintInfo = async (sprintId) => {
    const response = await api.asUser().requestJira(route`/rest/agile/1.0/sprint/${sprintId}`);

    if(!response.ok) return null;

    return response.json();
};

export function extractDateFromTimeStamp(date) {
    return new Date(date);
}

function extractSprintIdToVelocityMap(previousSprints) {
    const sprintIdToSprintDetailsMap = new Map;
    previousSprints.forEach(sprint => sprintIdToSprintDetailsMap.set(
            sprint.id,
            new Velocity(
                sprint.name,
                0,
                0,
                0,
                0,
                sprint.completeDate,
                sprint.startDate,
                sprint.endDate,
                sprint.goal)
        )
    );


    return sprintIdToSprintDetailsMap;
}

function fillCompleted(issues, sprintIdToVelocityMap) {

    issues.forEach(issue => {
        if (issue.fields.status.name === 'Done') {
            if (issue.fields.customfield_10020) {
                const sprints = issue.fields.customfield_10020;
                const lastSprint = sprints[sprints.length - 1];
                const velocity = sprintIdToVelocityMap.get(lastSprint.id);

                if (!velocity) {
                    return;
                }

                let storyPoints = issue.fields.customfield_10016;
                velocity.completed += storyPoints;
                if(storyPoints>0) velocity.completedUS++;
            }
        }
    });
}

function fillCommitments(issues, sprintIdToVelocityMap) {

    for (const issue of issues) {
        const sprints = issue.fields.customfield_10020;
        sprints.forEach(sprint => {
            const velocity = sprintIdToVelocityMap.get(sprint.id);

            if (!velocity) {
                return;
            }

            const actionsForSprint = getActionsForInterval(sprint.startDate, sprint.completeDate, issue.changelog.histories);

            if (!isIssueAddedAfterSprintStart(sprint.id, actionsForSprint)) {
                    let storyPointsBySprint = issue.fields.customfield_10016; /*getStoryPointsBySprint(issue, sprint);*/
                    velocity.commitments += issue.fields.customfield_10016;
                    if (storyPointsBySprint > 0) velocity.commitmentsUS++;
            }
        });
    }
}


function getStoryPointsBySprint(issue, sprint) { //REFACTORING: change spring to date interval for reusing
    const estimationChangesSortedByDate = issue.changelog.histories
        .filter(history =>
            extractDateFromTimeStamp(history.created) >= extractDateFromTimeStamp(issue.fields.created) &&
            extractDateFromTimeStamp(history.created) <= extractDateFromTimeStamp(sprint.startDate))
        .filter(history => history.items[0].fieldId === "customfield_10016")
        .sort((history1, history2) => extractDateFromTimeStamp(history1.created) >= extractDateFromTimeStamp(history2.created));

    if (estimationChangesSortedByDate.length > 0) return Number(estimationChangesSortedByDate[0].items[0].toString);

    return 0;
}

function isIssueAddedAfterSprintStart(sprintId, actions) {
    for (const action of actions) {
        if (action.items[0].field === "Sprint" &&
            (!action.items[0].from || !action.items[0].from.includes(sprintId)) &&
            action.items[0].to.includes(sprintId)
        ) {
            return true;
        }
    }
    return false;
}

function getActionsForInterval(startDate, endDate, histories) {
    return histories.filter(history =>
        extractDateFromTimeStamp(history.created) >= extractDateFromTimeStamp(startDate) &&
        extractDateFromTimeStamp(history.created) <= extractDateFromTimeStamp(endDate)
    );
}

function extractCarryovers(issues, sprint) {
    const carryovers = [];

    let validatedIssues = validateIssues(issues, sprint);

    validatedIssues.forEach(issue => {

        if (issue.fields.customfield_10020.length >= 1) {
            const actionsForInterval = getActionsForInterval(sprint.startDate, sprint.completeDate, issue.changelog.histories);

            const statusesTransitions = actionsForInterval
                .sort((action1, action2) => action2.created - action1.created)
                .map(action => action.items[0])
                .filter(x => x)
                .filter(item => item.field === "resolution" || item.field === "status");

            const lastStatusChange = statusesTransitions[0];

            if (!lastStatusChange || !(lastStatusChange.field === "resolution")) {
                carryovers.push(issue);
            }
        }
    })
    return carryovers;
}

function calculateAVGVelocityForPreviousSprints(sprintIdToVelocityMap, targetSprintId) {
    sprintIdToVelocityMap.delete(targetSprintId);

    let completed = Array.from([...sprintIdToVelocityMap.values()])
        .map(i => i.completed)
        .reduce(function (a, b) {
            return a + b;
        });

    let AVG = completed / sprintIdToVelocityMap.size;

    return Math.round(AVG);

}

function validateIssues(issues, sprint) {
    const valid = [];
    const sprintCompletedDate = extractDateFromTimeStamp(sprint.completeDate);
    issues.forEach(issue => {
        const [transitions] = getActionsForInterval(issue.fields.created, sprint.completeDate, issue.changelog.histories)
            .map(action => action.items[0])
            .filter(item => item.field === "Sprint")
            .map(item => item.to);
        const issueCreatedDate = extractDateFromTimeStamp(issue.fields.created);

        if (transitions.includes(sprint.id) && issueCreatedDate <= sprintCompletedDate) {
            valid.push(issue);
        }
    });

    return valid;
}

const App = () => {
    storage.delete("acronym-29");
    const config = useConfig() || defaultConfig;

    const sprintId = config.sprintId;

    if (!sprintId) {
        console.log("Oh shit here we gone again")
        return <Text>enter the spring id to render report</Text>;
    }
    const [sprintInfo] = useState(getSprintInfo(sprintId));

    if(!sprintInfo) {
        return <Text>Sprint with entered id doesn't exist</Text>;
    }

    const previousSprints = getPreviousSprintsBySprintId(sprintInfo);

    const sprintsIssues = getIssues(sprintInfo, previousSprints);

    const [allIssues] = useState(sprintsIssues);

    const sprintIdToVelocityMap = extractSprintIdToVelocityMap(previousSprints);

    fillCommitments(allIssues, sprintIdToVelocityMap);

    fillCompleted(allIssues, sprintIdToVelocityMap);

    const detailsForTargetSprint = sprintIdToVelocityMap.get(Number(sprintId));

    let carryovers = extractCarryovers(allIssues, sprintInfo).length;

    let velocityAVG = calculateAVGVelocityForPreviousSprints(sprintIdToVelocityMap, Number(sprintId));

    const [metric, updateMetric] = useState(getComments(sprintId));

    const [isOpenModal, setOpenModal] = useState(false);
    const [isOpenMultipleModal, setOpenMultipleModal] = useState(false);

    const [defaultValue, setDefaultValue] = useState(undefined);
    const [key, setKey] = useState(undefined);
    const [comment, setComment] = useState(undefined);
    const [commentRow, commentRowExist] = useState(true);

    return (
        <Fragment>
            {!!isOpenModal && (
                <AddCommentModalDialog
                    onOpen={() => {
                        // newCommentMap(commentMap);
                    }}
                    onClose={() => {
                        setOpenModal(false)
                        setComment(undefined);
                    }}
                    metric={metric}
                    updateMetric={updateMetric}
                    key={key}
                    sprintId={sprintId}
                    comment = {comment}
                    defaultValue = {defaultValue}
                />
            )}
            {!!isOpenMultipleModal && (
                <AddMultipleCommentModalDialog
                    onOpen={() => {
                    }}
                    onClose={() => {
                        setOpenMultipleModal(false)
                        setComment(undefined);
                    }}
                    metric={metric}
                    updateMetric={updateMetric}
                    sprintId={sprintId}
                    comment = {comment}
                    key={[key]}
                    setKey={setKey}
                    defaultValue = {[defaultValue]}
                />
            )}
            {
                <SprintMetricsTable
                    sprintId={sprintId}
                    sprintDetails={detailsForTargetSprint}
                    metric = {metric}
                    updateMetric = {updateMetric}
                    AVG={velocityAVG}
                    carryovers={carryovers}
                    isOpenModal={isOpenModal}
                    setOpenModal={setOpenModal}
                    setOpenMultipleModal={setOpenMultipleModal}
                    setComment={setComment}
                    key={key}
                    setKey={setKey}
                    defaultValue={defaultValue}
                    setDefaultValue={setDefaultValue}
                    commentRow={commentRow}
                    commentRowExist={commentRowExist}
                />
            }
        </Fragment>);
};


export const run = render(
    <Macro app={<App/>}
    />
);

// Function that defines the configuration UI
const Config = () => {
    return (
        <MacroConfig>
            <TextField name="sprintId" label="sprint id" defaultValue={defaultConfig.sprintId}/>
        </MacroConfig>
    );
};

export const config = render(<Config/>);