package com.taskmanager.dto;

import com.taskmanager.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateTaskStatusDto {

    @NotNull(message = "Status is required")
    public TaskStatus status;
}
