import ForgeUI, {
    Fragment, Text, Table, Head, Row, Cell, Button, Em, Strong, Heading, DateLozenge
} from "@forge/ui";
import {extractDateFromTimeStamp} from "./index";
import {removeCommentsByKeys, saveComments} from "./storage";
import {storage} from "@forge/api";

export const SprintMetricsTable = ({
                                       metric,
                                       sprintDetails,
                                       sprintId,
                                       AVG,
                                       carryovers,
                                       setOpenModal,
                                       setOpenMultipleModal,
                                       setComment,
                                       setKey,
                                       setDefaultValue,
                                       updateMetric,
                                       commentRowExist,
                                       commentRow

                                   }) => {

    return (
        <Fragment>
            <Heading size="large">Sprint statistic for {sprintDetails.name} </Heading>
            <Heading size="medium">Sprint general info</Heading>
            <Table>
                <Head>
                    <Cell>
                        <Text>Start date</Text>
                    </Cell>
                    <Cell>
                        <Text>End date</Text>
                    </Cell>
                    <Cell>
                        <Text>Goal</Text>
                    </Cell>
                </Head>
                <Row>
                    <Cell>
                        <Text><DateLozenge value={extractDateFromTimeStamp(sprintDetails.startDate).getTime()}/></Text>
                    </Cell>
                    <Cell>
                        <Text><DateLozenge value={extractDateFromTimeStamp(sprintDetails.endDate).getTime()}/></Text>
                    </Cell>
                    <Cell>
                        <Text><Em>{sprintDetails.goal}</Em></Text>
                    </Cell>
                </Row>
            </Table>
            <Table>
                <Head>
                    <Cell/>
                    <Cell>
                        <Text>Planned</Text>
                    </Cell>
                    <Cell>
                        <Text>Actual</Text>
                    </Cell>
                    <Cell>
                        <Text>Comments</Text>
                    </Cell>
                    <Cell>
                        <Text>Actions</Text>
                    </Cell>
                    <Cell>
                    </Cell>
                    <Cell>
                    </Cell>
                </Head>
                <Row>
                    <Cell><Text><Strong>SP Planned</Strong></Text></Cell>
                    <Cell><Text>{sprintDetails.commitments}</Text></Cell>
                    <Cell><Text>{sprintDetails.completed}</Text></Cell>
                    <Cell><Text><Em>{metric.plannedComment ? metric.plannedComment.definition : ""}</Em></Text></Cell>
                    <EditCommentRow
                        key={"plannedComment"}
                        metric={metric}
                        setKey={setKey}
                        setOpenModal={setOpenModal}
                        setComment={setComment}
                        setDefaultValue={setDefaultValue}
                        defaultValue={"Comment"}
                    />
{/*                    {
                        !!(metric.plannedComment && metric.plannedComment.definition) &&
                        <Cell><Button icon="trash" onClick={() => {
                            removeCommentsByKeys("plannedComment", metric)
                                .then(updateMetric(metric))
                                .then(saveComments(sprintId, metric));
                        }}/></Cell>
                    }*/}
                </Row>
                <Row>
                    <Cell><Text><Strong>US Planned</Strong></Text></Cell>
                    <Cell><Text>{sprintDetails.commitmentsUS}</Text></Cell>
                    <Cell><Text>{sprintDetails.completedUS}</Text></Cell>
                    <Cell><Text><Em>{metric.sp_PlannedComment ? metric.sp_PlannedComment.definition : ""}</Em></Text></Cell>
                    <EditCommentRow
                        key={"sp_PlannedComment"}
                        metric={metric}
                        setKey={setKey}
                        setOpenModal={setOpenModal}
                        setComment={setComment}
                        setDefaultValue={setDefaultValue}
                        defaultValue={"Comment"}
                    />
{/*                    {
                        !!(metric.sp_PlannedComment && metric.sp_PlannedComment.definition) &&
                        <Cell><Button icon="trash" onClick={() => {
                            removeCommentsByKeys("sp_PlannedComment", metric)
                                .then(updateMetric(metric))
                                .then(saveComments(sprintId, metric));
                        }}/></Cell>
                    }*/}
                </Row>
                <Row>
                    <Cell><Text><Strong>Carryovers</Strong></Text></Cell>
                    <Cell></Cell>
                    <Cell><Text>{carryovers}</Text></Cell>
                    <Cell><Text><Em>{metric.carryOverComment ? metric.carryOverComment.definition : ""}</Em></Text></Cell>
                    <EditCommentRow
                        key={"carryOverComment"}
                        metric={metric}
                        setKey={setKey}
                        setOpenModal={setOpenModal}
                        setComment={setComment}
                        setDefaultValue={setDefaultValue}
                        defaultValue={"Comment"}
                    />
{/*                    {
                        !!(metric.carryOverComment && metric.carryOverComment.definition) &&
                        <Cell><Button icon="trash" onClick={() => {
                            removeCommentsByKeys("carryOverComment", metric)
                                .then(updateMetric(metric))
                                .then(saveComments(sprintId, metric));
                        }}/></Cell>
                    }*/}
                </Row>
                <Row>
                    <Cell><Text><Strong>AVG velocity</Strong></Text></Cell>
                    <Cell></Cell>
                    <Cell><Text>{AVG}</Text></Cell>
                    <Cell><Text>{metric.velocityComment ? metric.velocityComment.definition : ""}</Text></Cell>
                    <EditCommentRow
                        key={"velocityComment"}
                        metric={metric}
                        setKey={setKey}
                        setOpenModal={setOpenModal}
                        setComment={setComment}
                        setDefaultValue={setDefaultValue}
                        defaultValue={"Comment"}
                    />
{/*                    {
                        !!(metric.velocityComment && metric.velocityComment.definition) &&
                        <Cell><Button icon="trash" onClick={() => {
                            removeCommentsByKeys("velocityComment", metric)
                                .then(updateMetric(metric))
                                .then(saveComments(sprintId, metric));
                        }}/></Cell>
                    }*/}
                </Row>
                {
                    commentRow && <Row>
                        <Cell>
                            <Text><Strong>Capacity, m/days</Strong></Text>
                        </Cell>

                        <Cell><Text><Em>{metric.capacityPlannedComment && metric.capacityPlannedComment.definition ? metric.capacityPlannedComment.definition : ""}</Em></Text></Cell>
                        <Cell><Text><Em>{metric.capacityActualComment && metric.capacityActualComment.definition ? metric.capacityActualComment.definition : ""}</Em></Text></Cell>
                        <Cell><Text><Em>{metric.capacityComment && metric.capacityComment.definition ? metric.capacityComment.definition : ""}</Em></Text></Cell>

                        <EditCommentRow
                            key={"capacityPlannedComment,capacityActualComment,capacityComment"}
                            setKey={setKey}
                            defaultValue={"Planned,Actual,Comment"}
                            setDefaultValue={setDefaultValue}
                            setOpenMultipleModal={setOpenMultipleModal}
                            metric={metric}
                            setOpenModal={setOpenModal}
                            setComment={setComment}
                            multiple={true}
                        />
{/*                        {
                            !!(
                                (metric.capacityComment && metric.capacityComment.definition) ||
                                (metric.capacityActualComment && metric.capacityActualComment.definition) ||
                                (metric.capacityPlannedComment && metric.capacityPlannedComment.definition)) &&
                            <Cell><Button icon="trash" onClick={() => {
                                removeCommentsByKeys("capacityPlannedComment,capacityActualComment,capacityComment", metric)
                                    .then(updateMetric(metric))
                                    .then(saveComments(sprintId, metric));

                            }}/>
                            </Cell>
                        }*/}
                        {
                            !!commentRow && <Cell><Button icon="cross" onClick={() => {
                                commentRowExist(false);
                            }}/></Cell>
                        }
                    </Row>
                }
            </Table>
            {
                !commentRow && <Button text="Display comment row" icon="add-item" onClick={() => {
                commentRowExist(true);
            }
            }/>
            }
        </Fragment>)
}

const EditCommentRow = ({
                            metric,
                            key,
                            setKey,
                            setOpenModal,
                            setOpenMultipleModal,
                            setComment,
                            defaultValue,
                            setDefaultValue,
                            multiple
                        }) => {

    let commentRow = null;
    let comment = multiple ? metric[key[0]] : metric[key];

    if (comment) comment = comment.definition;

    if (multiple) {
        commentRow =
            <Cell>
                <Button
                    icon="edit"
                    text="Edit"
                    onClick={() => {
                        setOpenMultipleModal(true);
                        setKey([key.split(',')]);
                        setDefaultValue([defaultValue.split(',')]);
                    }}
                />
            </Cell>
    } else {
        commentRow =
            <Cell>
                <Button
                    icon="edit"
                    text="Edit"
                    onClick={() => {
                        setOpenModal(true);
                        setKey(key);
                        setComment(comment);
                        setDefaultValue(defaultValue);
                    }}
                />
            </Cell>
    }

    return commentRow;
}