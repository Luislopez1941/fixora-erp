import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { setSelectedItem } from "../../redux/state/general/Select";

interface SelectData {
  selectName: string;
  dataSelect: any[];
  options: string;
}

interface SelectProps {
  dataSelects: SelectData;
  instanceId: string;
  nameSelect?: string;
}

const Select: React.FC<SelectProps> = ({ dataSelects, instanceId, nameSelect }) => {
  const [selects, setSelects] = useState<boolean>(false);
  const dispatch = useDispatch();
  const selectedItem = useSelector((state: any) => state.select.selectedItems[instanceId]);

  const handleSelectsChange = (selected: any) => {
    dispatch(setSelectedItem({ instanceId, item: selected }));
    setSelects(false);
  };

  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setSelects(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="select__container" ref={selectRef}>
      <label className="label__general">{nameSelect}</label>
      <div className="select-btn__general">
        <div
          className={`select-btn ${selects ? "active" : ""}`}
          onClick={() => setSelects(!selects)}
        >
          <div className="select__container_title">
            <p>
              {selectedItem
                ? selectedItem[dataSelects.options] || "Selecciona"
                : "Selecciona"}
            </p>
          </div>
          <svg
            className="chevron__down"
            xmlns="http://www.w3.org/2000/svg"
            height="16"
            width="16"
            viewBox="0 0 512 512"
          >
            <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
          </svg>
        </div>
        <div className={`content ${selects ? "active" : ""}`}>
          <ul
            className={`options ${selects ? "active" : ""}`}
            style={{ opacity: selects ? "1" : "0" }}
          >
            {(Array.isArray(dataSelects?.dataSelect) ? dataSelects.dataSelect : []).map((select: any) => (
              <li key={uuidv4()} onClick={() => handleSelectsChange(select)}>
                {select[dataSelects?.options] || "No disponible"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Select;
