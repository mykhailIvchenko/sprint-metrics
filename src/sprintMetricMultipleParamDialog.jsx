import ForgeUI, {Form, ModalDialog, TextArea} from "@forge/ui";
import {saveComments} from "./storage";

export const AddMultipleCommentModalDialog = (
    {
        metric,
        updateMetric,
        key,
        sprintId,
        onClose,
        onOpen,
        defaultValue
    }
) => {
    return <ModalDialog header={`Add definitions`} onClose={onClose}>
        <Form onSubmit={async (text) => {
            onOpen();

           Object.keys(metric).forEach(element => {
                if (element === key[0][0][0]) {
                    metric[element] && metric[element].definition ? metric[element].definition = text.definition : metric[element] = {"definition" : text.definition}
                } else if (element === key[0][0][1]) {
                    metric[element] && metric[element].definition  ? metric[element].definition = text.definition2 : metric[element] = {"definition" : text.definition2}
                } else if (element === key[0][0][2]) {
                    metric[element] && metric[element].definition ? metric[element].definition = text.definition3 : metric[element] = {"definition" : text.definition3}
                }
            });
            await saveComments(sprintId, metric);

            updateMetric(metric);

            onClose();
        }}>
            <TextArea name="definition" label={`Definition for ${defaultValue[0] ? defaultValue[0][0][0]:""}`}
                      defaultValue={key[0] && metric[key[0][0][0]] ? metric[key[0][0][0]].definition : ""}/>

            <TextArea name="definition2" label={`Definition for ${defaultValue[0] ? defaultValue[0][0][1]:""}`}
                      defaultValue={key[0] && metric[key[0][0][1]] ? metric[key[0][0][1]].definition : ""}/>

            <TextArea name="definition3" label={`Definition for ${defaultValue[0] ? defaultValue[0][0][2]:""}`}
                      defaultValue={key[0] && metric[key[0][0][2]] ? metric[key[0][0][2]].definition : ""}/>
        </Form>
    </ModalDialog>;
}