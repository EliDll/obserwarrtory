#############
### build ###
#############

# base image
FROM node:12.2.0 as build

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli

# add app
COPY . /app

# edit the scuffed library because it doesnt work otherwise
RUN sed -i "s|private goldenLayout;|public goldenLayout;|g" /app/node_modules/ngx-golden-layout/lib/golden-layout.component.d.ts

# generate build
RUN ng build --prod --build-optimizer --output-path=dist

############
### prod ###
############

# base image
FROM nginx:latest

# copy artifact build from the 'build environment'
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

# expose port 4200
EXPOSE 4200

# run nginx
# CMD ["nginx", "-g", "daemon off;"]

