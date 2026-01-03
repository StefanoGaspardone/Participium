import { components, type OptionProps } from "react-select";

type SelectOptionProps = OptionProps<any, false> & {
  idPrefix: string;
};

export const SelectOption = (props: SelectOptionProps) => {
  const id = `${props.idPrefix}${String(props.data?.value ?? "")}`;
  return (
    <div id={id}>
      <components.Option {...props} />
    </div>
  );
};

const ROLE_ID_BY_VALUE: Record<string, string> = {
  MUNICIPAL_ADMINISTRATOR: "municipal_administrator",
  PUBLIC_RELATIONS_OFFICER: "public_relations_officer",
  TECHNICAL_STAFF_MEMBER: "technical_staff_member",
  EXTERNAL_MAINTAINER: "external_maintainer",
};

export const RoleOption = (props: OptionProps<any, false>) => {
  const idPrefix = ROLE_ID_BY_VALUE[props.data.value] ?? "select-role";
  return <SelectOption {...props} idPrefix={idPrefix} />;
};

export const OfficeOption = (
  props: OptionProps<any, false> & { idPrefix?: string }
) => {
  return (
    <SelectOption {...props} idPrefix={props.idPrefix ?? "select-office"} />
  );
};

export const CompanyOption = (
  props: OptionProps<any, false> & { idPrefix?: string }
) => {
  return (
    <SelectOption {...props} idPrefix={props.idPrefix ?? "select-company"} />
  );
};

export const roleOptions = [
  { value: "MUNICIPAL_ADMINISTRATOR", label: "Municipal Administrator" },
  {
    value: "PUBLIC_RELATIONS_OFFICER",
    label: "Municipal Public Relations Officer",
  },
  { value: "TECHNICAL_STAFF_MEMBER", label: "Technical Office Staff Member" },
  { value: "EXTERNAL_MAINTAINER", label: "External Maintainer" },
];
