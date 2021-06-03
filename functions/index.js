const functions = require("firebase-functions")
const admin = require("firebase-admin")
const {
    GraphQLClient,
    gql
} = require('graphql-request')

admin.initializeApp(functions.config().firebase)

exports.processSignUp = functions.region("asia-east2").auth.user().onCreate((user) => {
    const graphQLClient = new GraphQLClient("http://203.113.148.132:22030/v1/graphql", {
        headers: {
            'content-type': 'application/graphql',
            'x-hasura-admin-secret': 'meowoof!'
        },
    })
    const customUserClaims = {
        'https://hasura.io/jwt/claims': {
            'x-hasura-default-role': 'user',
            "x-hasura-allowed-roles": ["user"],
            'x-hasura-user-id': user.uid, // user.uid,
        },
    }
    const mutation = gql `mutation MyMutation( $email: String! , $name: String! , $phone_number: String! , $uid: String! , $url: String! ) {
        insert_users_one(object: {email: $email, phone_number: $phone_number, uid: $uid, avatar_current: {data: {url: $url}}, name: $name}) {
          id
        }
      }
      
      `
    const variables = {
        email: user.email,
        name: user.displayName,
        phone_number: user.phoneNumber,
        uid: user.uid,
        url: user.photoURL
    }

    return (
        admin
        .auth()
        .setCustomUserClaims(user.uid, customUserClaims)
        .then(() => {
            graphQLClient.request(mutation, variables).then((data) => {
                console.log(data)
            });

        })
        .catch((error) => {
            console.log(error)
        })
    )
})