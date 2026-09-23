"use client";

import {
  AppBar,
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DemoRole } from "@/lib/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setRole } from "@/store/roleSlice";
import { api } from "@/store/api";

export function AppShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.role.role);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="primary">
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography
            component={Link}
            href="/purchase-orders"
            variant="h6"
            sx={{ color: "inherit", textDecoration: "none", flexGrow: 1 }}
          >
            DaaS Purchase Orders
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="role-label" sx={{ color: "common.white" }}>
              Demo role
            </InputLabel>
            <Select
              labelId="role-label"
              label="Demo role"
              value={role}
              onChange={(event) => {
                dispatch(setRole(event.target.value as DemoRole));
                dispatch(api.util.resetApiState());
              }}
              sx={{
                color: "common.white",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.4)",
                },
                ".MuiSvgIcon-root": { color: "common.white" },
              }}
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="WAREHOUSE">WAREHOUSE</MenuItem>
              <MenuItem value="VIEWER">VIEWER</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
