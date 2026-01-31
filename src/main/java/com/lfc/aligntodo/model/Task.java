package com.lfc.aligntodo.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lfc.aligntodo.model.enums.TaskPriorityEnum;
import com.lfc.aligntodo.model.enums.TaskStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = Task.TABLE_NAME)
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Task {
    public static final String TABLE_NAME = "task";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", unique = true)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "description", length = 255, nullable = false)
    @NotBlank
    @Size(min = 1, max = 255)
    private String description;

    @Column(name = "priority", nullable = false)
    private TaskPriorityEnum priority;

    @Column(name = "status", nullable = false)
    private TaskStatusEnum status = TaskStatusEnum.NAO_COMECOU;


    @Column(name = "created_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdDate;

    @Column(name = "deadline")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate deadline;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;
}
