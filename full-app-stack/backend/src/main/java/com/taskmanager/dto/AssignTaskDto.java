package com.taskmanager.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignTaskDto {

    @NotBlank(message = "Assignee user ID is required")
    public String assigneeUserId;
}
