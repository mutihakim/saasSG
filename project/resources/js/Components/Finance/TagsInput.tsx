import axios from "axios";
import React, { useMemo } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

import { useTenantRoute } from "../../common/tenantRoute";

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const TagsInput = ({ value, onChange }: TagsInputProps) => {
  const tenantRoute = useTenantRoute();

  const loadOptions = async (inputValue: string) => {
    try {
      const response = await axios.get(tenantRoute.apiTo("/finance/tags"), {
        params: { search: inputValue }
      });
      return (response.data.data || []).map((tag: any) => ({
        label: tag.name,
        value: tag.name,
        color: tag.color
      }));
    } catch {
      return [];
    }
  };

  const handleChange = (newValue: any) => {
    onChange(newValue ? newValue.map((v: any) => v.value) : []);
  };

  const selectValue = useMemo(() => 
    value.map(v => ({ label: v, value: v })), 
  [value]);

  const customStyles = {
    multiValue: (styles: any, { data }: any) => ({
      ...styles,
      backgroundColor: data.color ? `${data.color}22` : "#eff2f7",
    }),
    multiValueLabel: (styles: any, { data }: any) => ({
      ...styles,
      color: data.color || "#495057",
    }),
    multiValueRemove: (styles: any, { data }: any) => ({
      ...styles,
      color: data.color || "#495057",
      ':hover': {
        backgroundColor: data.color || "#495057",
        color: 'white',
      },
    }),
  };

  return (
    <AsyncCreatableSelect
      isMulti
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={selectValue}
      onChange={handleChange}
      placeholder="Type tags..."
      styles={customStyles}
      classNamePrefix="react-select"
    />
  );
};

export default TagsInput;
