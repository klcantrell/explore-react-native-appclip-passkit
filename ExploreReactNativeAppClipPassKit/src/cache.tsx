import Realm, { ObjectSchema } from 'realm';

let instance: Realm | null = null;

export default {
  async init() {
    try {
      instance = await Realm.open({
        schema: [AppleUserEntity],
        schemaVersion: 1,
      });
    } catch (error) {
      console.error('Realm failed to initialize', error);
    }
  },

  async dispose() {
    instance?.close();
  },

  getAppleUserById(id: string): AppleUser | null {
    if (instance !== null) {
      const appleUserEntities = instance.objects<AppleUserEntity>(
        AppleUserEntity.schema.name,
      );
      if (appleUserEntities.length === 1) {
        return {
          firstName: appleUserEntities[0].firstName,
          lastName: appleUserEntities[0].lastName,
          userId: appleUserEntities[0].userId,
        };
      } else {
        if (appleUserEntities.length > 1) {
          console.error(
            `Multiple Apple User entities were found with userId ${id}`,
          );
        }
        return null;
      }
    } else {
      console.error('Realm failed to initialize');
      return null;
    }
  },

  saveAppleUser(user: AppleUser) {
    if (instance !== null) {
      instance.write(() => {
        instance!.create<AppleUserEntity>(
          AppleUserEntity.schema.name,
          {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          Realm.UpdateMode.Modified,
        );
      });
    } else {
      console.error('Realm failed to initialize');
    }
  },
};

export interface AppleUser {
  userId: string;
  firstName: string;
  lastName: string;
}

class AppleUserEntity {
  public userId: string = '';
  public firstName: string = '';
  public lastName: string = '';

  public static schema: ObjectSchema = {
    name: 'AppleUser',
    primaryKey: 'userId',
    properties: {
      userId: 'string',
      firstName: 'string',
      lastName: 'string',
    },
  };
}
