import ForgeUI, {
    Cell,
    Fragment,
    Head,
    Heading,
    Macro,
    MacroConfig,
    render,
    Row,
    Table,
    Text,
    TextField,
    useConfig,
    useState,
    StatusLozenge,
    Link,
    Badge,
    Em,
    DateLozenge,
    useProductContext
} from "@forge/ui";

import api, {route} from "@forge/api";

const defaultConfig = {
    sprintId: null,
};

function getActionsForInterval(startDate, endDate, histories) {
    return histories.filter(history =>
        extractDateFromTimeStamp(history.created) >= extractDateFromTimeStamp(startDate) &&
        extractDateFromTimeStamp(history.created) <= extractDateFromTimeStamp(endDate)
    );
}

function extractDateFromTimeStamp(date) {
    return new Date(date);
}

function isIssueAddedAfterSprintStart(actions, sprintId) {
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

function isNew(actions, sprintId) {

    for (const action of actions) {
        if (action.items[0].field === "Sprint" &&
            !action.items[0].from && action.items[0].to.includes(sprintId)
        ) {
            return true;
        }
    }
    return false;
}

function isIssueCreatedDuringSprint(sprintStartDate, sprintCompletedDate, issueCreatedDate) {
    return extractDateFromTimeStamp(issueCreatedDate) >= extractDateFromTimeStamp(sprintStartDate) &&
        extractDateFromTimeStamp(issueCreatedDate) <= extractDateFromTimeStamp(sprintCompletedDate);
}

export function extractIssuesAddedAfterSprintStart(issues, sprint) {
    const issuesAddedAfterSprintStart = [];

    for (const issue of issues) {

        const actionsForSprint = getActionsForInterval(sprint.startDate, sprint.completeDate, issue.changelog.histories);

        if (isIssueAddedAfterSprintStart(actionsForSprint, sprint.id) || isIssueCreatedDuringSprint(sprint.startDate, sprint.completeDate, issue.fields.created)) {
            issuesAddedAfterSprintStart.push(issue);
        }
    }
    return issuesAddedAfterSprintStart;
}

export function extractNewIssues(issues, sprint) {
    const newIssues = [];
    issues.forEach(issue => {

        const actionsForSprint = getActionsForInterval(issue.fields.created, sprint.startDate, issue.changelog.histories);

        if (isNew(actionsForSprint, sprint.id) /*|| isIssueCreatedDuringSprint(sprint.startDate, sprint.completeDate, issue.fields.created)*/) {
            newIssues.push(issue);
        }
    });
    return newIssues;
}

function validateIssues(issues, sprint) {
    const valid = [];
    const sprintCompletedDate = extractDateFromTimeStamp(sprint.completeDate);

    issues.forEach(issue => {
        const transitions = getActionsForInterval(issue.fields.created, sprint.completeDate, issue.changelog.histories)
            .map(action => action.items[0])
            .filter(item => item.field === "Sprint")
            .map(item => item.to);
        const issueCreatedDate = extractDateFromTimeStamp(issue.fields.created);

        if (transitions.includes(sprint.id) || issueCreatedDate <= sprintCompletedDate) {
            valid.push(issue);
        }
    });

    return valid;
}

export function getAppearance(status) {
    switch (status) {
        case "In Progress":
            return 'inprogress';
        case "To Do":
            return 'new';
        case "Done":
            return 'success';
    }
}

const getSprintInfo = async (sprintId) => {
    const response = await api.asApp().requestJira(route`/rest/agile/1.0/sprint/${sprintId}`);

    return response.json();
};

export const getServerInfo = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/serverInfo`);
    const serverInfo = await response.json();

    if (!serverInfo ||
        (Object.keys(serverInfo).length === 0 && serverInfo.constructor === Object) ||
        serverInfo === "") {
        return null;
    }
    return serverInfo;
}

export const getIssuesForSprint = async (sprintId) => {
    const response = await api.asApp().requestJira(route`/rest/agile/1.0/sprint/${sprintId}/issue?expand=changelog`);
    const issues = await response.json();

    if (!issues ||
        (Object.keys(issues).length === 0 && issues.constructor === Object) ||
        issues === "") {
        return null;
    }
    return issues.issues;
};


function extractCarryovers(issues, sprint) {
    const allSprints = useState(getAllSprints(sprint.originBoardId));

    const previousSprints = allSprints
        .filter(x => x)
        .flatMap(allSprintsResponse => allSprintsResponse.values)
        .filter(x => x)
        .filter(target => target.startDate)
        .filter(target => extractDateFromTimeStamp(target.startDate) < extractDateFromTimeStamp(sprint.startDate))
        .sort((sprint1, sprint2) => sprint1.startDate > sprint2.startDate);

    const previousSprint = previousSprints[previousSprints.length - 1];

    if (!previousSprint) return []; //The first sprint

    let [issuesForPreviousSprint] = useState(getIssuesForSprint(previousSprint.id));

    let issuesForPreviousSprintKeys = validateIssues(issuesForPreviousSprint, previousSprint).map(issue => issue.key);

    return issues.filter(issue => issuesForPreviousSprintKeys.includes(issue.key));
}

const getAllSprints = async (boardId) => {
    const response = await api.asApp().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=closed`);
    return response.json();
}


export const IssuesMacro = () => {

    // const productContext = useProductContext();
    //
    // if (productContext.license.isActive !== true) {
    //     console.log("App is not licensed");
    //     return <Text>enter the spring id to render report</Text>;
    // }
   // Retrieve the configuration
    const config = useConfig() || defaultConfig;

    const sprintId = config.sprintId;
    if (!sprintId) {
        console.log("Oh shit here we gone again")
        return <Text>enter the spring id to render report</Text>;
    }

    const [serverInfo] = useState(getServerInfo());

    const url = serverInfo.baseUrl.concat("/").concat("browse");

    const [sprintInfo] = useState(getSprintInfo(sprintId));

    const [issues] = useState(getIssuesForSprint(sprintId));

    if (!sprintInfo || !issues ) {
        return <Text>No issues for target sprint</Text>;
    }

    const validatedIssues = validateIssues(issues, sprintInfo);

    const carryovers = extractCarryovers(validatedIssues, sprintInfo);

    const newIssues = extractNewIssues(validatedIssues, sprintInfo);

    const issuesAddedAfterSprintStart = extractIssuesAddedAfterSprintStart(validatedIssues, sprintInfo);

    return (
         <Fragment>
            <Heading size="large">{sprintInfo.name}</Heading>
            <Heading size="medium">Items from previous sprint</Heading>
            <Table>
                <Head>
                    <Cell>
                        <Text>Key 1</Text>
                    </Cell>
                    <Cell>
                        <Text>Summary</Text>
                    </Cell>
                    <Cell>
                        <Text>Status</Text>
                    </Cell>
                    <Cell>
                        <Text>Story Points</Text>
                    </Cell>
                </Head>
                {carryovers.map(issue => (
                    <Row>
                        <Cell>
                            <Text>
                                <Link appearance="button" href={url + "/" + issue.key} openNewTab="true">
                                    {issue.key}
                                </Link>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text><Em>{issue.fields.summary}</Em></Text>
                        </Cell>
                        <Cell>
                            <Text><StatusLozenge text={issue.fields.status.name}
                                                 appearance={getAppearance(issue.fields.status.name)}/></Text>
                        </Cell>
                        <Cell>
                            <Text><Badge appearance="primary" text={issue.fields.customfield_10016}/></Text>
                        </Cell>
                    </Row>
                ))}
            </Table>
            <Heading size="medium">New Items</Heading>
            <Table>
                {newIssues.map(issue => (
                    <Row>
                        <Cell>
                            <Text>
                                <Link appearance="button" href={url + "/" + issue.key} openNewTab="true">
                                    {issue.key}
                                </Link>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text><Em>{issue.fields.summary}</Em></Text>
                        </Cell>
                        <Cell>
                            <Text><StatusLozenge text={issue.fields.status.name}
                                                 appearance={getAppearance(issue.fields.status.name)}/></Text>
                        </Cell>
                        <Cell>
                            <Text><Badge appearance="primary" text={issue.fields.customfield_10016}/></Text>
                        </Cell>
                    </Row>
                ))}
            </Table>
            <Heading size="medium">Items added after sprint started</Heading>
            <Table>
                {issuesAddedAfterSprintStart.map(issue => (
                    <Row>
                        <Cell>
                            <Text>
                                <Link appearance="button" href={url + "/" + issue.key} openNewTab="true">
                                    {issue.key}
                                </Link>
                            </Text>
                        </Cell>
                        <Cell>
                            <Text><Em>{issue.fields.summary}</Em></Text>
                        </Cell>

                        <Cell>
                            <Text><StatusLozenge text={issue.fields.status.name}
                                                 appearance={getAppearance(issue.fields.status.name)}/></Text>
                        </Cell>
                        <Cell>
                            <Text><Badge appearance="primary" text={issue.fields.customfield_10016}/></Text>
                        </Cell>
                    </Row>
                ))}
            </Table>


            <Table>
                <Row>
                    <Cell><Text>Total</Text></Cell>
                    <Cell><Text>Story points sum:
                        {validatedIssues
                        .map(issue => issue.fields.customfield_10016)
                        .filter(i=>i)
                        .reduce(function (a, b) {
                            return a + b;
                        })
                        }
                    </Text>
                    </Cell>
                    <Cell>
                        <Text>Items count: {validatedIssues.length}</Text>
                    </Cell>
                </Row>
            </Table>

         </Fragment>
    );
};


// export const run = render(
//     <Macro app={<App/>}
//     />
// );

// Function that defines the configuration UI
const Config = () => {
    return (
        <MacroConfig>
            <TextField name="sprintId" label="sprint id" defaultValue={defaultConfig.sprintId}/>
        </MacroConfig>
    );
};

export const config = render(<Config/>);
