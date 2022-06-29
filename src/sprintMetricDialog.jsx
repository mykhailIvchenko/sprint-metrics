import ForgeUI, {Form, ModalDialog, TextArea} from "@forge/ui";
import {saveComments} from "./storage";

export const AddCommentModalDialog = ({metric, updateMetric, key, sprintId, onClose, onOpen, comment, defaultValue}) => {

    return <ModalDialog header={`Add definition for ${key}`} onClose={onClose}>
        <Form onSubmit={async (text) => {
            onOpen();

            if(metric[key] === undefined) {
                metric[key] = "";
            }

            Object.keys(metric).forEach(element => {
                if (key === element) {
                    metric[element] = text;
                }
            });

            await saveComments(sprintId, metric);

            updateMetric(metric);

            onClose();
        }}>
            <TextArea name="definition" label={`Definition for ${defaultValue}`} defaultValue={comment}/>
        </Form>
    </ModalDialog>;
};