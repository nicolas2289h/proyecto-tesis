package com.tesis.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssignRoleDto {
    @NotNull
    private Long usuarioId;
    @NotNull
    private Long rolId;
}
