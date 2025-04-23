import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Typography,
  Grid,
  Autocomplete,
  CircularProgress,
  Stack,
} from "@mui/material";
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import api from "../services/api";

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useState({
    query: "",
    type: "task",
    status: "",
    priority: "",
    assignee: null,
    tags: [],
    dateRange: [null, null],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    // Load users for assignee selection
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(response.data.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Load available tags
    const fetchTags = async () => {
      try {
        const response = await api.get(`/tags/${searchParams.type}`);
        setAvailableTags(response.data.tags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchUsers();
    fetchTags();
  }, [searchParams.type]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        query: searchParams.query,
        type: searchParams.type,
        status: searchParams.status,
        priority: searchParams.priority,
        assignee: searchParams.assignee?._id,
        tags: searchParams.tags.join(","),
        dateRange:
          searchParams.dateRange[0] && searchParams.dateRange[1]
            ? JSON.stringify({
                start: searchParams.dateRange[0].toISOString(),
                end: searchParams.dateRange[1].toISOString(),
              })
            : undefined,
      };

      const response = await api.advancedSearch(params);
      setResults(response.data);
    } catch (error) {
      console.error("Advanced search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (param, value) => {
    setSearchParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const renderSearchFilters = () => {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Query"
            value={searchParams.query}
            onChange={(e) => handleParamChange("query", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={searchParams.type}
              label="Type"
              onChange={(e) => handleParamChange("type", e.target.value)}
            >
              <MenuItem value="task">Tasks</MenuItem>
              <MenuItem value="project">Projects</MenuItem>
              <MenuItem value="team">Teams</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {searchParams.type === "task" && (
          <>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={searchParams.status}
                  label="Status"
                  onChange={(e) => handleParamChange("status", e.target.value)}
                >
                  <MenuItem value="todo">To Do</MenuItem>
                  <MenuItem value="inProgress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={searchParams.priority}
                  label="Priority"
                  onChange={(e) =>
                    handleParamChange("priority", e.target.value)
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                value={searchParams.assignee}
                onChange={(_, newValue) =>
                  handleParamChange("assignee", newValue)
                }
                options={users}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField {...params} label="Assignee" />
                )}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Autocomplete
            multiple
            value={searchParams.tags}
            onChange={(_, newValue) => handleParamChange("tags", newValue)}
            options={availableTags}
            renderInput={(params) => <TextField {...params} label="Tags" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} />
              ))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateRangePicker
              startText="Start Date"
              endText="End Date"
              value={searchParams.dateRange}
              onChange={(newValue) => handleParamChange("dateRange", newValue)}
              renderInput={(startProps, endProps) => (
                <>
                  <TextField {...startProps} />
                  <Box sx={{ mx: 2 }}> to </Box>
                  <TextField {...endProps} />
                </>
              )}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Search"}
          </Button>
        </Grid>
      </Grid>
    );
  };

  const renderResults = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!results.length) {
      return (
        <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
          No results found
        </Typography>
      );
    }

    return (
      <Stack spacing={2} sx={{ mt: 4 }}>
        {results.map((item) => (
          <Paper key={item._id} elevation={1} sx={{ p: 2 }}>
            {searchParams.type === "task" && (
              <Box>
                <Typography variant="h6">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {item.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Priority: {item.priority}
                </Typography>
                {item.assignees?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Assignees:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {item.assignees.map((assignee) => (
                        <Chip
                          key={assignee._id}
                          label={assignee.name}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}

            {searchParams.type === "project" && (
              <Box>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {item.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manager: {item.manager?.name}
                </Typography>
              </Box>
            )}

            {searchParams.type === "team" && (
              <Box>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Leader: {item.leader?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Members: {item.members?.length || 0}
                </Typography>
              </Box>
            )}

            {item.tags?.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {item.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Advanced Search
      </Typography>
      <Paper sx={{ p: 3 }}>{renderSearchFilters()}</Paper>
      {renderResults()}
    </Box>
  );
};

export default AdvancedSearch;
