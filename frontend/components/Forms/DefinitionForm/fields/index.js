// Field-type registry. Maps FormField.fieldType → React component.
// Phase 3 covers the 8 simple types directly. Complex types
// (rich_text, image, file, video_url, tag_multiselect, json_array)
// fall back to a graceful "not yet supported" placeholder so a
// definition that includes them still renders without crashing.
import {
  TextInput,
  TextareaInput,
  NumberInput,
  DateInput,
  CheckboxInput,
  SelectInput,
  MultiselectInput,
  ReadOnlyHtml,
} from "./inputs";
import ImageUpload from "./ImageUpload";
import FileUpload from "./FileUpload";
import VideoUrl from "./VideoUrl";
import RichText from "./RichText";
import JsonArray from "./JsonArray";
import TagMultiselect from "./TagMultiselect";
import SelectOneIcon from "./SelectOneIcon";
import TaskSelectorField from "./TaskSelectorField";
import DualTextarea from "./DualTextarea";
import { FieldShell } from "../styles";
import { fieldLabel } from "../i18n";

function NotYetSupported({ field, locale }) {
  return (
    <FieldShell as="div">
      <span className="label-text">{fieldLabel(field, locale)}</span>
      <span className="hint">
        Field type <code>{field.fieldType}</code> is not yet supported by
        this renderer. Edit it in the legacy form for now.
      </span>
    </FieldShell>
  );
}

const REGISTRY = {
  text: TextInput,
  textarea: TextareaInput,
  number: NumberInput,
  date: DateInput,
  checkbox: CheckboxInput,
  select: SelectInput,
  multiselect: MultiselectInput,
  read_only_html: ReadOnlyHtml,
  image: ImageUpload,
  file: FileUpload,
  video_url: VideoUrl,
  rich_text: RichText,
  json_array: JsonArray,
  tag_multiselect: TagMultiselect,
  select_one_icon: SelectOneIcon,
  task_selector: TaskSelectorField,
  dual_textarea: DualTextarea,
};

export function getFieldComponent(fieldType) {
  return REGISTRY[fieldType] || NotYetSupported;
}
