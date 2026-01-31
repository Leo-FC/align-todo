package com.lfc.aligntodo.model.converter;

import com.lfc.aligntodo.model.enums.TaskPriorityEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;


@Converter(autoApply = true)
public class TaskPriorityConverter implements AttributeConverter<TaskPriorityEnum, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TaskPriorityEnum priority) {
        if (priority == null) {
            return null;
        }
        return priority.getCode();
    }

    @Override
    public TaskPriorityEnum convertToEntityAttribute(Integer code) {
        if (code == null) {
            return null;
        }
        return TaskPriorityEnum.toEnum(code);
    }
}