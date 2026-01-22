package com.lfc.todosimple.model.projection;

import com.lfc.todosimple.model.enums.TaskPriorityEnum;
import com.lfc.todosimple.model.enums.TaskStatusEnum;

public interface TaskProjection {

    public Long getId();

    public String getDescription();

    public TaskPriorityEnum getPriority();

    public TaskStatusEnum getStatus();
}
