#stage 1
FROM golang:1.25-alpine AS builder
RUN apk add --no-cache git

WORKDIR /app


COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /ingestion ./ingestion/main.go


#stage 2
FROM alpine:3.18

RUN apk add --no-cache ca-certificates

# Set working directory
WORKDIR /app

# Copy the built binary from builder
COPY --from=builder /ingestion .

# Expose gRPC port
EXPOSE 8080

# Command to run the binary
CMD ["./ingestion"]