FROM mariadb:10.11

LABEL maintainer="Peer Evaluation Team"

# Copy initialization scripts to docker-entrypoint-initdb.d directory
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Make sure scripts are executable
RUN chmod +x /docker-entrypoint-initdb.d/*.sh 2>/dev/null || true && \
    chmod +r /docker-entrypoint-initdb.d/*.sql 2>/dev/null || true

# Create a custom configuration file
RUN echo "[mysqld]\ndefault-authentication-plugin=mysql_native_password\nbind-address=0.0.0.0\nmax_connections=1000\nwait_timeout=600\nmax_allowed_packet=64M" > /etc/mysql/conf.d/custom.cnf

EXPOSE 3306

CMD ["mariadbd"]
